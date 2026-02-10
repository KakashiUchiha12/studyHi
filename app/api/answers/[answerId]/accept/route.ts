import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { acceptAnswer } from "@/lib/qa/qaService";
import { prisma } from "@/lib/prisma";

// POST /api/answers/[answerId]/accept
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

    // Get answer and question
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: {
          select: {
            authorId: true,
          },
        },
      },
    });

    if (!answer) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }

    // Only question author can accept answers
    if (answer.question.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await acceptAnswer(answerId);

    return NextResponse.json({ message: "Answer accepted" });
  } catch (error) {
    console.error("Error accepting answer:", error);
    return NextResponse.json(
      { error: "Failed to accept answer" },
      { status: 500 }
    );
  }
}
