import { prisma } from "@/lib/prisma";

export type AchievementType =
  | "FIRST_PROJECT"
  | "PROLIFIC_CREATOR"
  | "COMMUNITY_FAVORITE"
  | "TRENDING_CREATOR"
  | "HELPFUL_EXPERT"
  | "PROBLEM_SOLVER"
  | "ENGAGED_MEMBER";

interface AchievementDefinition {
  type: AchievementType;
  title: string;
  description: string;
  iconUrl?: string;
}

const ACHIEVEMENTS: Record<AchievementType, AchievementDefinition> = {
  FIRST_PROJECT: {
    type: "FIRST_PROJECT",
    title: "First Project",
    description: "Published your first project",
    iconUrl: "/icons/achievements/first-project.svg",
  },
  PROLIFIC_CREATOR: {
    type: "PROLIFIC_CREATOR",
    title: "Prolific Creator",
    description: "Published 10 projects",
    iconUrl: "/icons/achievements/prolific-creator.svg",
  },
  COMMUNITY_FAVORITE: {
    type: "COMMUNITY_FAVORITE",
    title: "Community Favorite",
    description: "Received 100 total likes across all projects",
    iconUrl: "/icons/achievements/community-favorite.svg",
  },
  TRENDING_CREATOR: {
    type: "TRENDING_CREATOR",
    title: "Trending Creator",
    description: "Received 1000 total views across all projects",
    iconUrl: "/icons/achievements/trending-creator.svg",
  },
  HELPFUL_EXPERT: {
    type: "HELPFUL_EXPERT",
    title: "Helpful Expert",
    description: "Received 50 upvotes on answers",
    iconUrl: "/icons/achievements/helpful-expert.svg",
  },
  PROBLEM_SOLVER: {
    type: "PROBLEM_SOLVER",
    title: "Problem Solver",
    description: "Had 10 answers marked as accepted",
    iconUrl: "/icons/achievements/problem-solver.svg",
  },
  ENGAGED_MEMBER: {
    type: "ENGAGED_MEMBER",
    title: "Engaged Member",
    description: "Posted 100 comments or answers",
    iconUrl: "/icons/achievements/engaged-member.svg",
  },
};

export async function awardAchievement(
  userId: string,
  type: AchievementType
): Promise<boolean> {
  const definition = ACHIEVEMENTS[type];

  // Check if already awarded
  const existing = await prisma.achievement.findFirst({
    where: {
      userId,
      type,
    },
  });

  if (existing) {
    return false; // Already has this achievement
  }

  // Award the achievement
  await prisma.achievement.create({
    data: {
      userId,
      type,
      title: definition.title,
      description: definition.description,
      iconUrl: definition.iconUrl,
    },
  });

  return true;
}

export async function checkAndAwardAchievements(userId: string) {
  const awarded: AchievementType[] = [];

  // Check project-related achievements
  const projectCount = await prisma.project.count({
    where: { authorId: userId, isPublished: true },
  });

  if (projectCount >= 1) {
    const wasAwarded = await awardAchievement(userId, "FIRST_PROJECT");
    if (wasAwarded) awarded.push("FIRST_PROJECT");
  }

  if (projectCount >= 10) {
    const wasAwarded = await awardAchievement(userId, "PROLIFIC_CREATOR");
    if (wasAwarded) awarded.push("PROLIFIC_CREATOR");
  }

  // Check likes achievement
  const projectsWithLikes = await prisma.project.findMany({
    where: { authorId: userId, isPublished: true },
    select: {
      _count: {
        select: { likes: true },
      },
    },
  });

  const totalLikes = projectsWithLikes.reduce(
    (sum, p) => sum + p._count.likes,
    0
  );

  if (totalLikes >= 100) {
    const wasAwarded = await awardAchievement(userId, "COMMUNITY_FAVORITE");
    if (wasAwarded) awarded.push("COMMUNITY_FAVORITE");
  }

  // Check views achievement
  const projectsWithViews = await prisma.project.findMany({
    where: { authorId: userId, isPublished: true },
    select: { views: true },
  });

  const totalViews = projectsWithViews.reduce((sum, p) => sum + p.views, 0);

  if (totalViews >= 1000) {
    const wasAwarded = await awardAchievement(userId, "TRENDING_CREATOR");
    if (wasAwarded) awarded.push("TRENDING_CREATOR");
  }

  // Check Q&A achievements
  const answersWithVotes = await prisma.answer.findMany({
    where: { authorId: userId },
    select: { upvotes: true },
  });

  const totalAnswerUpvotes = answersWithVotes.reduce(
    (sum, a) => sum + a.upvotes,
    0
  );

  if (totalAnswerUpvotes >= 50) {
    const wasAwarded = await awardAchievement(userId, "HELPFUL_EXPERT");
    if (wasAwarded) awarded.push("HELPFUL_EXPERT");
  }

  const acceptedAnswersCount = await prisma.answer.count({
    where: { authorId: userId, isAccepted: true },
  });

  if (acceptedAnswersCount >= 10) {
    const wasAwarded = await awardAchievement(userId, "PROBLEM_SOLVER");
    if (wasAwarded) awarded.push("PROBLEM_SOLVER");
  }

  // Check engagement achievement
  const [commentCount, answerCount] = await Promise.all([
    prisma.projectComment.count({ where: { userId } }),
    prisma.answer.count({ where: { authorId: userId } }),
  ]);

  const totalEngagement = commentCount + answerCount;

  if (totalEngagement >= 100) {
    const wasAwarded = await awardAchievement(userId, "ENGAGED_MEMBER");
    if (wasAwarded) awarded.push("ENGAGED_MEMBER");
  }

  return awarded;
}

export function getAllAchievementDefinitions() {
  return Object.values(ACHIEVEMENTS);
}

export async function getUserAchievementsWithProgress(userId: string) {
  const [
    earnedAchievements,
    projectCount,
    projectsWithLikes,
    projectsWithViews,
    answersWithVotes,
    acceptedAnswersCount,
    commentCount,
    answerCount,
  ] = await Promise.all([
    prisma.achievement.findMany({
      where: { userId },
      select: { type: true, earnedAt: true },
    }),
    prisma.project.count({
      where: { authorId: userId, isPublished: true },
    }),
    prisma.project.findMany({
      where: { authorId: userId, isPublished: true },
      select: { _count: { select: { likes: true } } },
    }),
    prisma.project.findMany({
      where: { authorId: userId, isPublished: true },
      select: { views: true },
    }),
    prisma.answer.findMany({
      where: { authorId: userId },
      select: { upvotes: true },
    }),
    prisma.answer.count({
      where: { authorId: userId, isAccepted: true },
    }),
    prisma.projectComment.count({ where: { userId } }),
    prisma.answer.count({ where: { authorId: userId } }),
  ]);

  const totalLikes = projectsWithLikes.reduce(
    (sum, p) => sum + p._count.likes,
    0
  );
  const totalViews = projectsWithViews.reduce((sum, p) => sum + p.views, 0);
  const totalAnswerUpvotes = answersWithVotes.reduce(
    (sum, a) => sum + a.upvotes,
    0
  );
  const totalEngagement = commentCount + answerCount;

  const progress: Record<
    string,
    { current: number; target: number; earned: boolean; earnedAt?: Date }
  > = {
    FIRST_PROJECT: {
      current: projectCount,
      target: 1,
      earned: false,
    },
    PROLIFIC_CREATOR: {
      current: projectCount,
      target: 10,
      earned: false,
    },
    COMMUNITY_FAVORITE: {
      current: totalLikes,
      target: 100,
      earned: false,
    },
    TRENDING_CREATOR: {
      current: totalViews,
      target: 1000,
      earned: false,
    },
    HELPFUL_EXPERT: {
      current: totalAnswerUpvotes,
      target: 50,
      earned: false,
    },
    PROBLEM_SOLVER: {
      current: acceptedAnswersCount,
      target: 10,
      earned: false,
    },
    ENGAGED_MEMBER: {
      current: totalEngagement,
      target: 100,
      earned: false,
    },
  };

  // Mark earned achievements
  earnedAchievements.forEach((achievement) => {
    if (progress[achievement.type]) {
      progress[achievement.type].earned = true;
      progress[achievement.type].earnedAt = achievement.earnedAt;
    }
  });

  // Combine with definitions
  const allAchievements = Object.entries(ACHIEVEMENTS).map(([key, def]) => ({
    ...def,
    ...progress[key],
  }));

  return allAchievements;
}
