import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getProjectComments,
  createProjectComment,
} from "@/lib/projects/projectService";
import {
  projectCommentSchema,
  sanitizeHtml,
} from "@/lib/projects/projectValidation";

// GET /api/projects/[projectId]/comments
export async function GET(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const comments = await getProjectComments(projectId);

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/comments
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
    await projectCommentSchema.validate(body);

    // Sanitize content
    const sanitizedContent = sanitizeHtml(body.content);

    const comment = await createProjectComment(
      projectId,
      userId,
      sanitizedContent
    );

    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    console.error("Error creating comment:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
