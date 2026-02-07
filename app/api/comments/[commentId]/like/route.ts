import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    props: { params: Promise<{ commentId: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = (session.user as any).id;
        const commentId = params.commentId;

        const existingLike = await prisma.like.findUnique({
            where: {
                commentId_userId: {
                    commentId,
                    userId
                }
            }
        });

        if (existingLike) {
            await prisma.like.delete({
                where: {
                    commentId_userId: {
                        commentId,
                        userId
                    }
                }
            });
            return NextResponse.json({ liked: false });
        } else {
            const like = await prisma.like.create({
                data: {
                    userId,
                    commentId
                },
                include: {
                    comment: {
                        select: {
                            userId: true,
                            content: true,
                            postId: true
                        }
                    }
                }
            });

            // Trigger notification for comment owner
            if (like && like.comment.userId !== userId) {
                const { createNotification } = await import("@/lib/notifications-server");
                await createNotification({
                    userId: like.comment.userId,
                    senderId: userId,
                    type: "like",
                    title: "Comment Liked",
                    message: `${session.user?.name || 'Someone'} liked your comment: "${like.comment.content.substring(0, 30)}..."`,
                    actionUrl: `/feed` // Adjust if you have a specific post URL
                });
            }

            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        console.error("[COMMENT_LIKE_TOGGLE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
