import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const currentUserId = (session?.user as any)?.id;

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
            orderBy: { createdAt: "asc" }
        });
        return NextResponse.json(comments);
    } catch (error) {
        console.error("[COMMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
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
                    where: { userId: (session.user as any).id }, // Likely empty on creation but consistent structure
                    select: { userId: true }
                }
            }
        });

        return NextResponse.json(comment);
    } catch (error) {
        console.error("[COMMENT_CREATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
