import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createAnswer } from "@/lib/qa/qaService";
import {
  createAnswerSchema,
  sanitizeContent,
} from "@/lib/qa/qaValidation";

// POST /api/questions/[questionId]/answers
export async function POST(
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
    const body = await req.json();

    // Validate
    await createAnswerSchema.validate(body);

    // Sanitize
    const sanitizedContent = sanitizeContent(body.content);

    const answer = await createAnswer({
      questionId,
      authorId: userId,
      content: sanitizedContent,
    });

    return NextResponse.json(answer, { status: 201 });
  } catch (error: any) {
    console.error("Error creating answer:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create answer" },
      { status: 500 }
    );
  }
}
