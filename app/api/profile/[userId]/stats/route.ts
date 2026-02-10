import { NextResponse } from "next/server";
import { getProfileStats } from "@/lib/profile/profileService";

// GET /api/profile/[userId]/stats
export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const stats = await getProfileStats(userId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching profile stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile stats" },
      { status: 500 }
    );
  }
}
