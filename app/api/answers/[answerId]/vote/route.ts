import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { voteAnswer, removeAnswerVote } from "@/lib/qa/qaService";

// POST /api/answers/[answerId]/vote
export async function POST(
  req: Request,
  context: { params: Promise<{ answerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { answerId } = await context.params;
    const userId = (session.user as any).id;
    const body = await req.json();

    const { value } = body;

    if (value !== 1 && value !== -1) {
      return NextResponse.json(
        { error: "Vote value must be 1 or -1" },
        { status: 400 }
      );
    }

    const vote = await voteAnswer(answerId, userId, value);

    return NextResponse.json(vote);
  } catch (error) {
    console.error("Error voting on answer:", error);
    return NextResponse.json(
      { error: "Failed to vote on answer" },
      { status: 500 }
    );
  }
}

// DELETE /api/answers/[answerId]/vote
export async function DELETE(
  req: Request,
  context: { params: Promise<{ answerId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { answerId } = await context.params;
    const userId = (session.user as any).id;

    await removeAnswerVote(answerId, userId);

    return NextResponse.json({ message: "Vote removed" });
  } catch (error) {
    console.error("Error removing vote:", error);
    return NextResponse.json(
      { error: "Failed to remove vote" },
      { status: 500 }
    );
  }
}
