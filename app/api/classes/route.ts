import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/classes/permissions";

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    let classes;

    if (query) {
      classes = await prisma.class.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { subject: { contains: query } },
          ],
          members: {
            some: {
              userId: user.id,
              status: "approved",
            },
          },
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
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      classes = await prisma.class.findMany({
        where: {
          members: {
            some: {
              userId: user.id,
              status: "approved",
            },
          },
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
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json(classes);
  } catch (error) {
    console.error("[CLASSES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
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

    const { name, description, subject, schedule, room, banner, icon, isPrivate } = await req.json();

    if (!name) {
      return new NextResponse("Name is required", { status: 400 });
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let isUnique = false;

    while (!isUnique) {
      const existing = await prisma.class.findUnique({
        where: { inviteCode },
      });

      if (!existing) {
        isUnique = true;
      } else {
        inviteCode = generateInviteCode();
      }
    }

    const classData = await prisma.class.create({
      data: {
        name,
        description,
        subject,
        schedule,
        room,
        banner,
        icon,
        inviteCode,
        isPrivate: isPrivate || false,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: "admin",
            status: "approved",
          },
        },
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
    console.error("[CLASSES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
