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
    const { inviteCode } = await req.json();

    // Find class by ID or invite code
    const classData = await prisma.class.findFirst({
      where: {
        OR: [
          { id: classId },
          { inviteCode: inviteCode },
        ],
      },
    });

    if (!classData) {
      return new NextResponse("Class not found", { status: 404 });
    }

    // Check if already a member
    const existingMember = await prisma.classMember.findUnique({
      where: {
        classId_userId: {
          classId: classData.id,
          userId: user.id,
        },
      },
    });

    if (existingMember) {
      if (existingMember.status === "approved") {
        return new NextResponse("Already a member", { status: 400 });
      } else {
        return new NextResponse("Join request pending", { status: 400 });
      }
    }

    // Create membership
    const member = await prisma.classMember.create({
      data: {
        classId: classData.id,
        userId: user.id,
        role: "student",
        status: classData.isPrivate ? "pending" : "approved",
      },
    });

    return NextResponse.json({
      success: true,
      status: member.status,
      classId: classData.id,
    });
  } catch (error) {
    console.error("[CLASS_JOIN]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
