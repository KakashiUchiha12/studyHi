import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getProjectById,
  updateProject,
  deleteProject,
} from "@/lib/projects/projectService";
import {
  updateProjectSchema,
  sanitizeHtml,
} from "@/lib/projects/projectValidation";

// GET /api/projects/[projectId]
export async function GET(
  req: Request,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await context.params;
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : undefined;

    const project = await getProjectById(projectId, userId);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user can view unpublished projects
    if (!project.isPublished && project.authorId !== userId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[projectId]
export async function PUT(
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

    // Check ownership
    const existing = await getProjectById(projectId);
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (existing.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Validate input
    await updateProjectSchema.validate(body);

    // Sanitize content
    const sanitizedData = {
      ...body,
      ...(body.title && { title: sanitizeHtml(body.title) }),
      ...(body.description && { description: sanitizeHtml(body.description) }),
    };

    const project = await updateProject(projectId, sanitizedData);

    return NextResponse.json(project);
  } catch (error: any) {
    console.error("Error updating project:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId]
export async function DELETE(
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

    // Check ownership
    const existing = await getProjectById(projectId);
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (existing.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await deleteProject(projectId);

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
