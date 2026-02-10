import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { inviteCode } = await req.json();

    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    // Find class by invite code
    const classData = await prisma.class.findUnique({
      where: {
        inviteCode: inviteCode.toUpperCase(),
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "Invalid class code" }, { status: 404 });
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
        return NextResponse.json({ error: "You are already a member of this class" }, { status: 400 });
      } else {
        return NextResponse.json({ error: "Your join request is pending approval" }, { status: 400 });
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
      message: member.status === "pending" 
        ? "Join request sent. Waiting for approval." 
        : "Successfully joined the class!",
    });
  } catch (error) {
    console.error("[CLASS_JOIN]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
