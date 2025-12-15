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
        const postId = params.id;

        const existingLike = await prisma.like.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            }
        });

        if (existingLike) {
            await prisma.like.delete({
                where: {
                    userId_postId: {
                        userId,
                        postId
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
            return NextResponse.json({ liked: true });
        }
    } catch (error) {
        console.error("[LIKE_TOGGLE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
