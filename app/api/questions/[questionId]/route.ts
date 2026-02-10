import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  createAnswer,
} from "@/lib/qa/qaService";
import {
  updateQuestionSchema,
  createAnswerSchema,
  sanitizeContent,
} from "@/lib/qa/qaValidation";

// GET /api/questions/[questionId]
export async function GET(
  req: Request,
  context: { params: Promise<{ questionId: string }> }
) {
  try {
    const { questionId } = await context.params;
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : undefined;

    const question = await getQuestionById(questionId, userId);

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(question);
  } catch (error) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 }
    );
  }
}

// PUT /api/questions/[questionId]
export async function PUT(
  req: Request,
  context: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questionId } = await context.params;
    const userId = (session.user as any).id;

    // Check ownership
    const existing = await getQuestionById(questionId);
    if (!existing) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    if (existing.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Validate
    await updateQuestionSchema.validate(body);

    // Sanitize
    const sanitizedData = {
      ...(body.title && { title: sanitizeContent(body.title) }),
      ...(body.content && { content: sanitizeContent(body.content) }),
    };

    const question = await updateQuestion(questionId, sanitizedData);

    return NextResponse.json(question);
  } catch (error: any) {
    console.error("Error updating question:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/[questionId]
export async function DELETE(
  req: Request,
  context: { params: Promise<{ questionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { questionId } = await context.params;
    const userId = (session.user as any).id;

    // Check ownership
    const existing = await getQuestionById(questionId);
    if (!existing) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    if (existing.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteQuestion(questionId);

    return NextResponse.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    );
  }
}
