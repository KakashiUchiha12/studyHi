import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getProjects, createProject } from "@/lib/projects/projectService";
import {
  createProjectSchema,
  sanitizeHtml,
} from "@/lib/projects/projectValidation";

// GET /api/projects - List projects with filters
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      category: searchParams.get("category") || undefined,
      authorId: searchParams.get("authorId") || undefined,
      featured: searchParams.get("featured") === "true" || undefined,
      search: searchParams.get("search") || undefined,
      tags: searchParams.get("tags")?.split(",").filter(Boolean) || undefined,
    };

    const options = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "12"),
      sortBy: (searchParams.get("sortBy") ||
        "newest") as "newest" | "popular" | "mostLiked" | "mostViewed",
    };

    const result = await getProjects(filters, options);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate input
    await createProjectSchema.validate(body);

    // Sanitize content
    const sanitizedData = {
      ...body,
      title: sanitizeHtml(body.title),
      description: sanitizeHtml(body.description),
      sections: body.sections?.map((section: any) => ({
        ...section,
        title: sanitizeHtml(section.title),
        content: sanitizeHtml(section.content),
      })),
    };

    const project = await createProject({
      authorId: (session.user as any).id,
      ...sanitizedData,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    console.error("Error creating project:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
