import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher-server";

const POSTS_BATCH = 20;

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get("cursor");
        const communityId = searchParams.get("communityId");
        const userId = searchParams.get("userId"); // View specific user's posts

        const isAnnouncement = searchParams.get("isAnnouncement") === "true";
        const status = searchParams.get("status") || "published";

        // Build where clause
        let whereClause: any = {};
        if (status === "published") {
            whereClause.status = "published";
        } else {
            whereClause.status = status;
        }

        if (communityId) {
            whereClause.communityId = communityId;
        } else if (userId) {
            whereClause.userId = userId;
        }

        if (isAnnouncement) {
            whereClause.isAnnouncement = true;
        }

        let posts;

        const selectionBlock = {
            id: true,
            content: true,
            isAnnouncement: true,
            status: true,
            viewCount: true,
            createdAt: true,
            updatedAt: true,
            user: {
                select: { name: true, image: true, id: true }
            },
            community: {
                select: { name: true, id: true }
            },
            _count: {
                select: { comments: true, likes: true }
            },
            likes: session ? {
                where: { userId: (session.user as any).id },
                select: { userId: true }
            } : false,
            attachments: {
                select: {
                    id: true,
                    url: true,
                    name: true,
                    type: true,
                    size: true
                }
            }
        };

        if (cursor) {
            posts = await prisma.post.findMany({
                take: POSTS_BATCH,
                skip: 1,
                cursor: { id: cursor },
                where: whereClause,
                select: selectionBlock,
                orderBy: { createdAt: "desc" }
            });
        } else {
            posts = await prisma.post.findMany({
                take: POSTS_BATCH,
                where: whereClause,
                select: selectionBlock,
                orderBy: { createdAt: "desc" }
            });
        }

        return NextResponse.json(posts);
    } catch (error) {
        console.error("[POSTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { content, communityId, attachments, isAnnouncement } = await req.json();

        if (!content && (!attachments || attachments.length === 0)) {
            return new NextResponse("Content or attachments missing", { status: 400 });
        }

        const post = await prisma.post.create({
            data: {
                content: content || "",
                userId: (session.user as any).id,
                communityId, // Optional
                isAnnouncement: isAnnouncement || false,
                status: "published",
                attachments: {
                    create: attachments?.map((att: any) => ({
                        url: att.url,
                        type: att.type,
                        name: att.name,
                        size: att.size
                    }))
                }
            },
            include: {
                attachments: true
            }
        });

        // Fetch complete post data for realtime update (including user relationships)
        const completePost = await prisma.post.findUnique({
            where: { id: post.id },
            select: {
                id: true,
                content: true,
                isAnnouncement: true,
                status: true,
                viewCount: true,
                createdAt: true,
                updatedAt: true,
                user: {
                    select: { name: true, image: true, id: true }
                },
                community: {
                    select: { name: true, id: true }
                },
                _count: {
                    select: { comments: true, likes: true }
                },
                attachments: {
                    select: {
                        id: true,
                        url: true,
                        name: true,
                        type: true,
                        size: true
                    }
                },
                likes: {
                    select: { userId: true } // Empty initially but keeps structure consistent
                }
            }
        });

        // Trigger Pusher Event
        if (pusherServer) {
            try {
                if (communityId) {
                    await pusherServer.trigger(`community-${communityId}`, 'new-post', completePost);
                } else {
                    await pusherServer.trigger('global-feed', 'new-post', completePost);
                }
            } catch (pusherError) {
                console.error("[PUSHER_TRIGGER_ERROR]", pusherError);
                // We don't throw here so the post creation still succeeds even if realtime fails
            }
        }

        return NextResponse.json(completePost);
    } catch (error) {
        console.error("[POSTS_CREATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
