import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        const currentUserId = (session?.user as any)?.id;

        // Get cursor from query params
        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get("cursor");

        const comments = await prisma.comment.findMany({
            where: { postId: params.id },
            include: {
                user: {
                    select: { name: true, image: true, id: true }
                },
                _count: {
                    select: { likes: true }
                },
                likes: currentUserId ? {
                    where: { userId: currentUserId },
                    select: { userId: true }
                } : false
            },
            orderBy: { createdAt: "asc" },
            take: 50, // Reduced to 50 for pagination
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
        });
        return NextResponse.json(comments);
    } catch (error) {
        console.error("[COMMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { content, parentId } = await req.json();

        const comment = await prisma.comment.create({
            data: {
                content,
                postId: params.id,
                userId: (session.user as any).id,
                parentId: parentId || null
            },
            include: {
                user: {
                    select: { name: true, image: true, id: true }
                },
                _count: {
                    select: { likes: true }
                },
                likes: {
                    where: { userId: (session.user as any).id },
                    select: { userId: true }
                }
            }
        });

        // Trigger Pusher update
        if (pusherServer) {
            try {
                // Fetch updated counts for the post
                const updatedPost = await prisma.post.findUnique({
                    where: { id: params.id },
                    select: {
                        communityId: true,
                        _count: {
                            select: { likes: true, comments: true }
                        }
                    }
                });

                if (updatedPost) {
                    // Notify global feed
                    await pusherServer.trigger('global-feed', 'post-updated', {
                        id: params.id,
                        _count: updatedPost._count
                    });

                    // Notify community channel if applicable
                    if (updatedPost.communityId) {
                        await pusherServer.trigger(`community-${updatedPost.communityId}`, 'post-updated', {
                            id: params.id,
                            _count: updatedPost._count
                        });
                    }
                }
            } catch (pusherError) {
                console.error("[PUSHER_COMMENT_TRIGGER_ERROR]", pusherError);
            }
        }

        return NextResponse.json(comment);
    } catch (error) {
        console.error("[COMMENT_CREATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
