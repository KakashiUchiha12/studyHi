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

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: { 
            members: true,
            posts: true,
            assignments: true,
          },
        },
        members: {
          where: { userId: user.id },
          select: { role: true, status: true },
        },
      },
    });

    if (!classData) {
      return new NextResponse("Class not found", { status: 404 });
    }

    // Check if user is a member
    const isMember = await isClassMember(user.id, classId);
    if (!isMember && classData.isPrivate) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    return NextResponse.json(classData);
  } catch (error) {
    console.error("[CLASS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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

    const { name, description, subject, schedule, room, banner, icon, isPrivate } = await req.json();

    const classData = await prisma.class.update({
      where: { id: classId },
      data: {
        name,
        description,
        subject,
        schedule,
        room,
        banner,
        icon,
        isPrivate,
      },
      include: {
        _count: {
          select: { members: true },
        },
        members: {
          where: { userId: user.id },
          select: { role: true, status: true },
        },
      },
    });

    return NextResponse.json(classData);
  } catch (error) {
    console.error("[CLASS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
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

    await prisma.class.delete({
      where: { id: classId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CLASS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
