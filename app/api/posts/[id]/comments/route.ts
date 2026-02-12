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

        // Trigger notification for post owner
        const post = await prisma.post.findUnique({
            where: { id: params.id },
            select: { userId: true, content: true }
        });

        if (post && post.userId !== (session?.user as any).id) {
            const { createNotification } = await import("@/lib/notifications-server");
            await createNotification({
                userId: post.userId,
                senderId: (session?.user as any).id,
                type: "comment",
                title: "New Comment",
                message: `${session?.user?.name} commented on your post: "${post.content.substring(0, 30)}${post.content.length > 30 ? "..." : ""}"`,
                actionUrl: `/feed` // Adjust if you have a specific post URL
            });
        }

        // Trigger notification for parent comment owner if it's a reply
        if (parentId) {
            const parentComment = await prisma.comment.findUnique({
                where: { id: parentId },
                select: { userId: true, content: true }
            });

            if (parentComment && parentComment.userId !== (session?.user as any).id && parentComment.userId !== post?.userId) {
                const { createNotification } = await import("@/lib/notifications-server");
                await createNotification({
                    userId: parentComment.userId,
                    senderId: (session?.user as any).id,
                    type: "comment",
                    title: "New Reply",
                    message: `${session?.user?.name} replied to your comment: "${parentComment.content.substring(0, 30)}${parentComment.content.length > 30 ? "..." : ""}"`,
                    actionUrl: `/feed` // Adjust if you have a specific post URL
                });
            }
        }

        return NextResponse.json(comment);
    } catch (error) {
        console.error("[COMMENT_CREATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
