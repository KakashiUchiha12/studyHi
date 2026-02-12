import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface QuestionFilters {
  projectId?: string;
  authorId?: string;
  isSolved?: boolean;
}

export interface QuestionOptions {
  sortBy?: "newest" | "mostUpvoted" | "unsolved" | "solved";
  page?: number;
  limit?: number;
}

// Questions
export async function getProjectQuestions(
  projectId: string,
  options: QuestionOptions = {}
) {
  const { sortBy = "newest", page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const where: Prisma.QuestionWhereInput = { projectId };

  if (sortBy === "unsolved") {
    where.isSolved = false;
  } else if (sortBy === "solved") {
    where.isSolved = true;
  }

  let orderBy: Prisma.QuestionOrderByWithRelationInput = {};
  switch (sortBy) {
    case "mostUpvoted":
      orderBy = { upvotes: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        _count: {
          select: { answers: true },
        },
      },
    }),
    prisma.question.count({ where }),
  ]);

  return {
    questions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getQuestionById(questionId: string, userId?: string) {
  // Increment view count (async)
  prisma.question.update({
    where: { id: questionId },
    data: { viewCount: { increment: 1 } }
  }).catch(() => { });

  return await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
        },
      },
      project: {
        select: {
          id: true,
          title: true,
          authorId: true,
        },
      },
      answers: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
              username: true,
            },
          },
          ...(userId && {
            answerVotes: {
              where: { userId },
              select: { value: true },
            },
          }),
        },
        orderBy: [{ isAccepted: "desc" }, { upvotes: "desc" }],
      },
      ...(userId && {
        questionVotes: {
          where: { userId },
          select: { value: true },
        },
      }),
    },
  });
}

export async function createQuestion(data: {
  projectId: string;
  authorId: string;
  title: string;
  content: string;
}) {
  return await prisma.question.create({
    data,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
        },
      },
    },
  });
}

export async function updateQuestion(
  questionId: string,
  data: Partial<{ title: string; content: string }>
) {
  return await prisma.question.update({
    where: { id: questionId },
    data,
  });
}

export async function deleteQuestion(questionId: string) {
  return await prisma.question.delete({
    where: { id: questionId },
  });
}

export async function markAsSolved(questionId: string, answerId: string) {
  // First, unmark any previously accepted answer
  await prisma.answer.updateMany({
    where: { questionId, isAccepted: true },
    data: { isAccepted: false, acceptedAt: null },
  });

  // Mark the new answer as accepted
  await prisma.answer.update({
    where: { id: answerId },
    data: { isAccepted: true, acceptedAt: new Date() },
  });

  // Mark question as solved
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: { authorId: true },
  });

  return await prisma.question.update({
    where: { id: questionId },
    data: {
      isSolved: true,
      solvedAt: new Date(),
      solvedById: answer?.authorId,
    },
  });
}

// Answers
export async function getQuestionAnswers(
  questionId: string,
  sortBy: "newest" | "mostUpvoted" | "accepted" = "accepted"
) {
  let orderBy: Prisma.AnswerOrderByWithRelationInput[] = [];

  switch (sortBy) {
    case "newest":
      orderBy = [{ createdAt: "desc" }];
      break;
    case "mostUpvoted":
      orderBy = [{ upvotes: "desc" }];
      break;
    default:
      orderBy = [{ isAccepted: "desc" }, { upvotes: "desc" }];
  }

  return await prisma.answer.findMany({
    where: { questionId },
    orderBy,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
        },
      },
    },
  });
}

export async function createAnswer(data: {
  questionId: string;
  authorId: string;
  content: string;
}) {
  return await prisma.answer.create({
    data,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
        },
      },
    },
  });
}

export async function updateAnswer(answerId: string, content: string) {
  return await prisma.answer.update({
    where: { id: answerId },
    data: { content },
  });
}

export async function deleteAnswer(answerId: string) {
  return await prisma.answer.delete({
    where: { id: answerId },
  });
}

export async function acceptAnswer(answerId: string) {
  const answer = await prisma.answer.findUnique({
    where: { id: answerId },
    select: { questionId: true, authorId: true },
  });

  if (!answer) {
    throw new Error("Answer not found");
  }

  // Unmark any previously accepted answer
  await prisma.answer.updateMany({
    where: { questionId: answer.questionId, isAccepted: true },
    data: { isAccepted: false, acceptedAt: null },
  });

  // Mark this answer as accepted
  await prisma.answer.update({
    where: { id: answerId },
    data: { isAccepted: true, acceptedAt: new Date() },
  });

  // Mark question as solved
  await prisma.question.update({
    where: { id: answer.questionId },
    data: {
      isSolved: true,
      solvedAt: new Date(),
      solvedById: answer.authorId,
    },
  });

  return answer;
}

// Voting
export async function voteQuestion(
  questionId: string,
  userId: string,
  value: number
) {
  try {
    // Try to create new vote
    const vote = await prisma.questionVote.create({
      data: {
        questionId,
        userId,
        value,
      },
    });

    // Update upvotes count
    await updateQuestionUpvotes(questionId);

    return vote;
  } catch (error: any) {
    // If vote already exists, update it
    if (error.code === "P2002") {
      const vote = await prisma.questionVote.update({
        where: {
          questionId_userId: {
            questionId,
            userId,
          },
        },
        data: { value },
      });

      await updateQuestionUpvotes(questionId);

      return vote;
    }
    throw error;
  }
}

export async function removeQuestionVote(questionId: string, userId: string) {
  await prisma.questionVote.delete({
    where: {
      questionId_userId: {
        questionId,
        userId,
      },
    },
  });

  await updateQuestionUpvotes(questionId);
}

export async function voteAnswer(
  answerId: string,
  userId: string,
  value: number
) {
  try {
    const vote = await prisma.answerVote.create({
      data: {
        answerId,
        userId,
        value,
      },
    });

    await updateAnswerUpvotes(answerId);

    return vote;
  } catch (error: any) {
    if (error.code === "P2002") {
      const vote = await prisma.answerVote.update({
        where: {
          answerId_userId: {
            answerId,
            userId,
          },
        },
        data: { value },
      });

      await updateAnswerUpvotes(answerId);

      return vote;
    }
    throw error;
  }
}

export async function removeAnswerVote(answerId: string, userId: string) {
  await prisma.answerVote.delete({
    where: {
      answerId_userId: {
        answerId,
        userId,
      },
    },
  });

  await updateAnswerUpvotes(answerId);
}

// Helper functions to update vote counts
async function updateQuestionUpvotes(questionId: string) {
  const votes = await prisma.questionVote.findMany({
    where: { questionId },
    select: { value: true },
  });

  const upvotes = votes.reduce((sum, vote) => sum + vote.value, 0);

  await prisma.question.update({
    where: { id: questionId },
    data: { upvotes },
  });
}

async function updateAnswerUpvotes(answerId: string) {
  const votes = await prisma.answerVote.findMany({
    where: { answerId },
    select: { value: true },
  });

  const upvotes = votes.reduce((sum, vote) => sum + vote.value, 0);

  await prisma.answer.update({
    where: { id: answerId },
    data: { upvotes },
  });
}
