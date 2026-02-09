import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClassMember } from "@/lib/classes/permissions";

export async function GET(req: Request, { params }: { params: { id: string; postId: string } }) {
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

    // Check if user is a member
    const isMember = await isClassMember(user.id, classId);
    if (!isMember) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const comments = await prisma.postComment.findMany({
      where: { 
        postId,
        parentId: null, // Only get top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("[POST_COMMENTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

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

    // Check if user is a member
    const isMember = await isClassMember(user.id, classId);
    if (!isMember) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { content, parentId } = await req.json();

    if (!content) {
      return new NextResponse("Content is required", { status: 400 });
    }

    const comment = await prisma.postComment.create({
      data: {
        postId,
        userId: user.id,
        content,
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("[POST_COMMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
