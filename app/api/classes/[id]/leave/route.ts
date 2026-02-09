import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
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

    const classId = params.id;

    // Check if member exists
    const member = await prisma.classMember.findUnique({
      where: {
        classId_userId: {
          classId,
          userId: user.id,
        },
      },
    });

    if (!member) {
      return new NextResponse("Not a member", { status: 400 });
    }

    // Check if user is the class owner
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: { ownerId: true },
    });

    if (classData?.ownerId === user.id) {
      return new NextResponse("Cannot leave your own class", { status: 400 });
    }

    // Delete membership
    await prisma.classMember.delete({
      where: {
        classId_userId: {
          classId,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CLASS_LEAVE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
