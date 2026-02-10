import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getProjectQuestions,
  createQuestion,
} from "@/lib/qa/qaService";
import {
  createQuestionSchema,
  sanitizeContent,
} from "@/lib/qa/qaValidation";

// GET /api/projects/[projectId]/questions
export async function GET(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const { searchParams } = new URL(req.url);

    const options = {
      sortBy: (searchParams.get("sortBy") || "newest") as any,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "20"),
    };

    const result = await getProjectQuestions(projectId, options);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/questions
export async function POST(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await context.params;
    const userId = (session.user as any).id;
    const body = await req.json();

    // Validate input
    await createQuestionSchema.validate(body);

    // Sanitize content
    const sanitizedData = {
      title: sanitizeContent(body.title),
      content: sanitizeContent(body.content),
    };

    const question = await createQuestion({
      projectId,
      authorId: userId,
      ...sanitizedData,
    });

    return NextResponse.json(question, { status: 201 });
  } catch (error: any) {
    console.error("Error creating question:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}
