import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canGradeAssignments } from "@/lib/classes/permissions";

export async function POST(req: Request, { params }: { params: { id: string; assignmentId: string } }) {
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

    const { id: classId, assignmentId } = params;

    // Check if user can grade assignments
    const canGrade = await canGradeAssignments(user.id, classId);
    if (!canGrade) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const { submissionId, grade, feedback } = await req.json();

    if (!submissionId) {
      return new NextResponse("Submission ID is required", { status: 400 });
    }

    const submission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        grade,
        feedback,
        gradedAt: new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("[ASSIGNMENT_GRADE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
