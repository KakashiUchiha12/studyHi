import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = (session.user as any).id;
        const commentId = params.id;

        const existingLike = await prisma.like.findFirst({
            where: {
                commentId,
                userId
            }
        });

        if (existingLike) {
            await prisma.like.delete({
                where: {
                    id: existingLike.id
                }
            });
            return NextResponse.json({ liked: false });
        } else {
            await prisma.like.create({
                data: {
                    commentId,
                    userId
                }
            });
            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        console.error("[COMMENT_LIKE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
