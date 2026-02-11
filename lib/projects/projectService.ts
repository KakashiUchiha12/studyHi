import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface ProjectFilters {
  category?: string;
  tags?: string[];
  authorId?: string;
  featured?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: "newest" | "popular" | "mostLiked" | "mostViewed";
}

export async function getProjects(
  filters: ProjectFilters = {},
  options: PaginationOptions = {}
) {
  const { page = 1, limit = 12, sortBy = "newest" } = options;
  const skip = (page - 1) * limit;

  const where: Prisma.ProjectWhereInput = {
    isPublished: true,
    ...(filters.category && { category: filters.category }),
    ...(filters.authorId && { authorId: filters.authorId }),
    ...(filters.featured && { isFeatured: true }),
    ...(filters.tags && filters.tags.length > 0 && {
      tags: {
        path: "$",
        array_contains: filters.tags,
      },
    }),
    ...(filters.search && {
      OR: [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ],
    }),
  };

  let orderBy: Prisma.ProjectOrderByWithRelationInput = {};
  switch (sortBy) {
    case "popular":
      orderBy = { views: "desc" };
      break;
    case "mostLiked":
      orderBy = { likes: { _count: "desc" } };
      break;
    case "mostViewed":
      orderBy = { views: "desc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
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
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    projects,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProjectById(projectId: string, userId?: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
          bio: true,
        },
      },
      sections: {
        orderBy: { order: "asc" },
      },
      _count: {
        select: {
          likes: true,
          comments: true,
          questions: true,
        },
      },
      ...(userId && {
        likes: {
          where: { userId },
          select: { userId: true },
        },
      }),
    },
  });

  // Increment view count (async, don't await)
  if (project) {
    prisma.project
      .update({
        where: { id: projectId },
        data: { views: { increment: 1 } },
      })
      .catch(() => { }); // Ignore errors in view tracking
  }

  return project;
}

export async function createProject(data: {
  authorId: string;
  title: string;
  description: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  isPublished?: boolean;
  sections?: Array<{
    order: number;
    title: string;
    content: string;
    images?: string[];
    videoUrl?: string;
    videoType?: string;
  }>;
}) {
  const { sections, tags, ...projectData } = data;

  return await prisma.project.create({
    data: {
      ...projectData,
      tags: tags ? (tags as any) : undefined,
      sections: sections
        ? {
          create: sections.map((section) => ({
            ...section,
            images: section.images ? (section.images as any) : undefined,
          })),
        }
        : undefined,
    },
    include: {
      sections: {
        orderBy: { order: "asc" },
      },
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

export async function updateProject(
  projectId: string,
  data: Partial<{
    title: string;
    description: string;
    coverImage: string;
    category: string;
    tags: string[];
    isPublished: boolean;
    isFeatured: boolean;
    sections: Array<{
      order: number;
      title: string;
      content: string;
      images?: string[];
      videoUrl?: string;
      videoType?: string;
    }>;
  }>
) {
  const { tags, sections, ...updateData } = data;

  // If sections are provided, delete existing ones and create new ones
  if (sections !== undefined) {
    await prisma.projectSection.deleteMany({
      where: { projectId },
    });
  }

  return await prisma.project.update({
    where: { id: projectId },
    data: {
      ...updateData,
      ...(tags !== undefined && { tags: JSON.stringify(tags) }),
      ...(sections && {
        sections: {
          create: sections.map((section) => ({
            ...section,
            images: section.images ? JSON.stringify(section.images) : null,
          })),
        },
      }),
    },
    include: {
      sections: {
        orderBy: { order: "asc" },
      },
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });
}

export async function deleteProject(projectId: string) {
  return await prisma.project.delete({
    where: { id: projectId },
  });
}

export async function likeProject(projectId: string, userId: string) {
  try {
    const like = await prisma.projectLike.create({
      data: {
        projectId,
        userId,
      },
    });
    return { liked: true, like };
  } catch (error: any) {
    // Already liked
    if (error.code === "P2002") {
      const like = await prisma.projectLike.delete({
        where: {
          projectId_userId: {
            projectId,
            userId,
          },
        },
      });
      return { liked: false, like };
    }
    throw error;
  }
}

export async function getProjectComments(projectId: string) {
  return await prisma.projectComment.findMany({
    where: { projectId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          username: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProjectComment(
  projectId: string,
  userId: string,
  content: string
) {
  return await prisma.projectComment.create({
    data: {
      projectId,
      userId,
      content,
    },
    include: {
      user: {
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

export async function deleteProjectComment(commentId: string) {
  return await prisma.projectComment.delete({
    where: { id: commentId },
  });
}
