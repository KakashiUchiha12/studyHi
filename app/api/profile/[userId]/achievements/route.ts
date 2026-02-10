import { NextResponse } from "next/server";
import { getUserAchievementsWithProgress } from "@/lib/profile/achievementService";

// GET /api/profile/[userId]/achievements
export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const achievements = await getUserAchievementsWithProgress(userId);

    return NextResponse.json(achievements);
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json(
      { error: "Failed to fetch achievements" },
      { status: 500 }
    );
  }
}
