import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isClassMember } from "@/lib/classes/permissions";

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

    // Check if user is a member
    const isMember = await isClassMember(user.id, classId);
    if (!isMember) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get assignment details
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { dueDate: true, allowLateSubmission: true },
    });

    if (!assignment) {
      return new NextResponse("Assignment not found", { status: 404 });
    }

    const now = new Date();
    const isLate = now > assignment.dueDate;

    if (isLate && !assignment.allowLateSubmission) {
      return new NextResponse("Late submissions not allowed", { status: 400 });
    }

    const { files } = await req.json();

    if (!files || files.length === 0) {
      return new NextResponse("Files are required", { status: 400 });
    }

    // Check if already submitted
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: user.id,
        },
      },
    });

    let submission;

    if (existingSubmission) {
      // Update existing submission
      submission = await prisma.assignmentSubmission.update({
        where: { id: existingSubmission.id },
        data: {
          files: JSON.stringify(files),
          submittedAt: now,
          isLate,
        },
      });
    } else {
      // Create new submission
      submission = await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          studentId: user.id,
          files: JSON.stringify(files),
          submittedAt: now,
          isLate,
        },
      });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("[ASSIGNMENT_SUBMIT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
