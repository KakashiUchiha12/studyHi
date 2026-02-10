import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { voteQuestion, removeQuestionVote } from "@/lib/qa/qaService";

// POST /api/questions/[questionId]/vote
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

    const { value } = body;

    if (value !== 1 && value !== -1) {
      return NextResponse.json(
        { error: "Vote value must be 1 or -1" },
        { status: 400 }
      );
    }

    const vote = await voteQuestion(questionId, userId, value);

    return NextResponse.json(vote);
  } catch (error) {
    console.error("Error voting on question:", error);
    return NextResponse.json(
      { error: "Failed to vote on question" },
      { status: 500 }
    );
  }
}

// DELETE /api/questions/[questionId]/vote
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

    await removeQuestionVote(questionId, userId);

    return NextResponse.json({ message: "Vote removed" });
  } catch (error) {
    console.error("Error removing vote:", error);
    return NextResponse.json(
      { error: "Failed to remove vote" },
      { status: 500 }
    );
  }
}
