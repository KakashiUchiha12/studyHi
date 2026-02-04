import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function POST(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params; // Await params in Next.js 15

    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = (session.user as any).id;
        const postId = params.id;

        console.log("[LIKE_API] Hit", { userId, postId });

        const existingLike = await prisma.like.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId
                }
            }
        });

        if (existingLike) {
            await prisma.like.delete({
                where: {
                    postId_userId: {
                        postId,
                        userId
                    }
                }
            });
            return NextResponse.json({ liked: false });
        } else {
            await prisma.like.create({
                data: {
                    userId,
                    postId
                }
            });
        }

        // Trigger Pusher update
        if (pusherServer) {
            try {
                // Fetch updated counts
                const updatedPost = await prisma.post.findUnique({
                    where: { id: postId },
                    select: {
                        _count: {
                            select: { likes: true, comments: true }
                        }
                    }
                });

                if (updatedPost) {
                    await pusherServer.trigger('global-feed', 'post-updated', {
                        id: postId,
                        _count: updatedPost._count
                    });

                    // Also trigger for specific community if we can find it
                    const postWithCommunity = await prisma.post.findUnique({
                        where: { id: postId },
                        select: { communityId: true }
                    });

                    if (postWithCommunity?.communityId) {
                        await pusherServer.trigger(`community-${postWithCommunity.communityId}`, 'post-updated', {
                            id: postId,
                            _count: updatedPost._count
                        });
                    }
                }
            } catch (pusherError) {
                console.error("[PUSHER_LIKE_TRIGGER_ERROR]", pusherError);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[LIKE_TOGGLE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
