import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canPinPosts } from "@/lib/classes/permissions";

export async function POST(req: Request, { params }: { params: { id: string; postId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const { id: classId, postId } = params;

    // Check if user can pin posts
    const canPin = await canPinPosts(user.id, classId);
    if (!canPin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get current pin status
    const post = await prisma.classPost.findUnique({
      where: { id: postId },
      select: { isPinned: true },
    });

    if (!post) {
      return new NextResponse("Post not found", { status: 404 });
    }

    // Toggle pin status
    const updatedPost = await prisma.classPost.update({
      where: { id: postId },
      data: { isPinned: !post.isPinned },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error("[POST_PIN]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
