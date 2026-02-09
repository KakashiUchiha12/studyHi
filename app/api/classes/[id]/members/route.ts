import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClassMember, isClassAdmin } from "@/lib/classes/permissions";

export async function GET(req: Request, { params }: { params: { id: string } }) {
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

    // Check if user is a member
    const isMember = await isClassMember(user.id, classId);
    if (!isMember) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const members = await prisma.classMember.findMany({
      where: { 
        classId,
        status: "approved",
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
      orderBy: [
        { role: "asc" },
        { joinedAt: "asc" },
      ],
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("[CLASS_MEMBERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

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

    // Check if user is admin
    const isAdmin = await isClassAdmin(user.id, classId);
    if (!isAdmin) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { userId, role } = await req.json();

    if (!userId || !role) {
      return new NextResponse("User ID and role are required", { status: 400 });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Check if already a member
    const existingMember = await prisma.classMember.findUnique({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
    });

    if (existingMember) {
      return new NextResponse("User is already a member", { status: 400 });
    }

    const member = await prisma.classMember.create({
      data: {
        classId,
        userId,
        role,
        status: "approved",
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

    return NextResponse.json(member);
  } catch (error) {
    console.error("[CLASS_MEMBERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
