import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClassMember } from "@/lib/classes/permissions";

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

    // Check if already liked
    const existingLike = await prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.postLike.delete({
        where: { id: existingLike.id },
      });
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await prisma.postLike.create({
        data: {
          postId,
          userId: user.id,
        },
      });
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("[POST_LIKE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
