import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getUserProfile,
  updateUserProfile,
} from "@/lib/profile/profileService";
import { sanitizeHtml } from "@/lib/projects/projectValidation";

// GET /api/profile/[userId] - Get user profile
export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const profile = await getUserProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PUT /api/profile/[userId] - Update user profile (own profile only)
export async function PUT(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await context.params;
    const currentUserId = (session.user as any).id;

    // Can only update own profile
    if (userId !== currentUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Validate limits
    if (body.skillTags && body.skillTags.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 skills allowed" },
        { status: 400 }
      );
    }

    if (body.expertiseAreas && body.expertiseAreas.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 expertise areas allowed" },
        { status: 400 }
      );
    }

    if (body.featuredProjectIds && body.featuredProjectIds.length > 6) {
      return NextResponse.json(
        { error: "Maximum 6 featured projects allowed" },
        { status: 400 }
      );
    }

    // Sanitize bio
    const sanitizedData = {
      ...body,
      ...(body.bio && { bio: sanitizeHtml(body.bio) }),
    };

    const profile = await updateUserProfile(userId, sanitizedData);

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
