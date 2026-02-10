import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  updateAnswer,
  deleteAnswer,
  acceptAnswer,
} from "@/lib/qa/qaService";
import {
  updateAnswerSchema,
  sanitizeContent,
} from "@/lib/qa/qaValidation";
import { prisma } from "@/lib/prisma";

// PUT /api/answers/[answerId]
export async function PUT(
  req: Request,
  context: { params: Promise<{ answerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { answerId } = await context.params;
    const userId = (session.user as any).id;

    // Check ownership
    const existing = await prisma.answer.findUnique({
      where: { id: answerId },
      select: { authorId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    if (existing.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Validate
    await updateAnswerSchema.validate(body);

    // Sanitize
    const sanitizedContent = sanitizeContent(body.content);

    const answer = await updateAnswer(answerId, sanitizedContent);

    return NextResponse.json(answer);
  } catch (error: any) {
    console.error("Error updating answer:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update answer" },
      { status: 500 }
    );
  }
}

// DELETE /api/answers/[answerId]
export async function DELETE(
  req: Request,
  context: { params: Promise<{ answerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { answerId } = await context.params;
    const userId = (session.user as any).id;

    // Check ownership
    const existing = await prisma.answer.findUnique({
      where: { id: answerId },
      select: { authorId: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    if (existing.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteAnswer(answerId);

    return NextResponse.json({ message: "Answer deleted successfully" });
  } catch (error) {
    console.error("Error deleting answer:", error);
    return NextResponse.json(
      { error: "Failed to delete answer" },
      { status: 500 }
    );
  }
}
