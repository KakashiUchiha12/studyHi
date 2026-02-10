import { prisma } from "@/lib/prisma";

export interface ProfileUpdateData {
  bio?: string;
  skillTags?: string[];
  expertiseAreas?: string[];
  featuredProjectIds?: string[];
}

export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      skillTags: true,
      expertiseAreas: true,
      featuredProjectIds: true,
      createdAt: true,
      socialProfile: {
        select: {
          website: true,
          github: true,
          linkedin: true,
          twitter: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  // Get featured projects
  const featuredProjectIds = user.featuredProjectIds
    ? (JSON.parse(user.featuredProjectIds as string) as string[])
    : [];

  let featuredProjects = [];
  if (featuredProjectIds.length > 0) {
    featuredProjects = await prisma.project.findMany({
      where: {
        id: { in: featuredProjectIds },
        isPublished: true,
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
  }

  // Get achievements
  const achievements = await prisma.achievement.findMany({
    where: { userId },
    orderBy: { earnedAt: "desc" },
  });

  // Get aggregated stats
  const stats = await getProfileStats(userId);

  return {
    ...user,
    skillTags: user.skillTags ? JSON.parse(user.skillTags as string) : [],
    expertiseAreas: user.expertiseAreas
      ? JSON.parse(user.expertiseAreas as string)
      : [],
    featuredProjects,
    achievements,
    stats,
  };
}

export async function updateUserProfile(
  userId: string,
  data: ProfileUpdateData
) {
  const updateData: any = {};

  if (data.bio !== undefined) {
    updateData.bio = data.bio;
  }

  if (data.skillTags !== undefined) {
    // Limit to 10 skills
    const skills = data.skillTags.slice(0, 10);
    updateData.skillTags = JSON.stringify(skills);
  }

  if (data.expertiseAreas !== undefined) {
    // Limit to 5 expertise areas
    const areas = data.expertiseAreas.slice(0, 5);
    updateData.expertiseAreas = JSON.stringify(areas);
  }

  if (data.featuredProjectIds !== undefined) {
    // Limit to 6 featured projects
    const projectIds = data.featuredProjectIds.slice(0, 6);

    // Verify user owns these projects
    const projects = await prisma.project.findMany({
      where: {
        id: { in: projectIds },
        authorId: userId,
        isPublished: true,
      },
      select: { id: true },
    });

    const validIds = projects.map((p) => p.id);
    updateData.featuredProjectIds = JSON.stringify(validIds);
  }

  return await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      username: true,
      bio: true,
      skillTags: true,
      expertiseAreas: true,
      featuredProjectIds: true,
    },
  });
}

export async function getProfileStats(userId: string) {
  const [
    totalProjects,
    publishedProjects,
    projectsWithStats,
    totalComments,
    totalQuestions,
    totalAnswers,
    acceptedAnswers,
  ] = await Promise.all([
    // Total projects
    prisma.project.count({
      where: { authorId: userId },
    }),
    // Published projects
    prisma.project.count({
      where: { authorId: userId, isPublished: true },
    }),
    // Get views and likes
    prisma.project.findMany({
      where: { authorId: userId, isPublished: true },
      select: {
        views: true,
        _count: {
          select: { likes: true },
        },
      },
    }),
    // Total project comments received
    prisma.projectComment.count({
      where: {
        project: {
          authorId: userId,
        },
      },
    }),
    // Total questions asked
    prisma.question.count({
      where: { authorId: userId },
    }),
    // Total answers given
    prisma.answer.count({
      where: { authorId: userId },
    }),
    // Accepted answers
    prisma.answer.count({
      where: { authorId: userId, isAccepted: true },
    }),
  ]);

  const totalViews = projectsWithStats.reduce((sum, p) => sum + p.views, 0);
  const totalLikes = projectsWithStats.reduce(
    (sum, p) => sum + p._count.likes,
    0
  );

  return {
    totalProjects,
    publishedProjects,
    totalViews,
    totalLikes,
    totalComments,
    totalQuestions,
    totalAnswers,
    acceptedAnswers,
  };
}

export async function getUserAchievements(userId: string) {
  return await prisma.achievement.findMany({
    where: { userId },
    orderBy: { earnedAt: "desc" },
  });
}

export async function setFeaturedProjects(
  userId: string,
  projectIds: string[]
) {
  // Limit to 6 projects
  const limitedIds = projectIds.slice(0, 6);

  // Verify user owns these projects and they're published
  const projects = await prisma.project.findMany({
    where: {
      id: { in: limitedIds },
      authorId: userId,
      isPublished: true,
    },
    select: { id: true },
  });

  const validIds = projects.map((p) => p.id);

  await prisma.user.update({
    where: { id: userId },
    data: {
      featuredProjectIds: JSON.stringify(validIds),
    },
  });

  return validIds;
}
