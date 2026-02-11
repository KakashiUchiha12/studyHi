import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ commentId: string }> }
) {
    const { commentId } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return new NextResponse("Not found", { status: 404 });
        }

        if (comment.userId !== (session.user as any).id) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.comment.delete({
            where: { id: commentId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[COMMENT_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ commentId: string }> }
) {
    const { commentId } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { content } = await req.json();

        const comment = await prisma.comment.findUnique({
            where: { id: commentId }
        });

        if (!comment) {
            return new NextResponse("Not found", { status: 404 });
        }

        if (comment.userId !== (session.user as any).id) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: commentId },
            data: { content },
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

        return NextResponse.json(updatedComment);
    } catch (error) {
        console.error("[COMMENT_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
