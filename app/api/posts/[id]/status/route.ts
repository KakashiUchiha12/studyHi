import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { status } = await req.json();
        const postId = params.id;

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { userId: true }
        });

        if (!post) {
            return new NextResponse("Post not found", { status: 404 });
        }

        if (post.userId !== (session.user as any).id) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const updatedPost = await prisma.post.update({
            where: { id: postId },
            data: { status }
        });

        return NextResponse.json(updatedPost);
    } catch (error) {
        console.error("[POST_STATUS_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const postId = params.id;

        const post = await prisma.post.findUnique({
            where: { id: postId },
            select: { userId: true }
        });

        if (!post) {
            return new NextResponse("Post not found", { status: 404 });
        }

        if (post.userId !== (session.user as any).id) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.post.delete({
            where: { id: postId }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[POST_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
