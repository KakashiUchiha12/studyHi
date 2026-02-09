import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClassMember, canManageAssignments } from "@/lib/classes/permissions";

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

    const assignments = await prisma.assignment.findMany({
      where: { classId },
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
          select: { submissions: true },
        },
        submissions: {
          where: { studentId: user.id },
          select: {
            id: true,
            submittedAt: true,
            isLate: true,
            grade: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("[ASSIGNMENTS_GET]", error);
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

    // Check if user can create assignments
    const canManage = await canManageAssignments(user.id, classId);
    if (!canManage) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { title, instructions, dueDate, points, allowLateSubmission, attachments } = await req.json();

    if (!title || !instructions || !dueDate) {
      return new NextResponse("Title, instructions, and due date are required", { status: 400 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        classId,
        userId: user.id,
        title,
        instructions,
        dueDate: new Date(dueDate),
        points: points || 100,
        allowLateSubmission: allowLateSubmission !== undefined ? allowLateSubmission : true,
        attachments: JSON.stringify(attachments || []),
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
        _count: {
          select: { submissions: true },
        },
      },
    });

    return NextResponse.json(assignment);
  } catch (error) {
    console.error("[ASSIGNMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
