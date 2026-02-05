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
            await prisma.like.create({
                data: {
                    userId,
                    commentId
                }
            });
            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        console.error("[COMMENT_LIKE_TOGGLE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
