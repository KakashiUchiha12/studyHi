import { dbService } from '@/lib/database'
import { Prisma } from '@prisma/client'

export interface CourseFilters {
  category?: string
  difficulty?: string
  language?: string
  status?: string
  instructorId?: string
  search?: string
  slug?: string
  minPrice?: number
  maxPrice?: number
  rating?: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

const buildCourseWhereClause = (filters: CourseFilters) => {
  const conditions: any[] = []

  if (filters.category) {
    conditions.push({ category: filters.category })
  }

  if (filters.difficulty) {
    conditions.push({ difficulty: filters.difficulty })
  }

  if (filters.language) {
    conditions.push({ language: filters.language })
  }

  if (filters.status) {
    conditions.push({ status: filters.status })
  }

  if (filters.slug) {
    conditions.push({ slug: filters.slug })
  }

  if (filters.instructorId) {
    conditions.push({ userId: filters.instructorId })
  }

  if (filters.search) {
    conditions.push({
      OR: [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { shortDescription: { contains: filters.search } }
      ]
    })
  }

  if (filters.minPrice !== undefined) {
    conditions.push({ price: { gte: filters.minPrice } })
  }

  if (filters.maxPrice !== undefined) {
    conditions.push({ price: { lte: filters.maxPrice } })
  }

  if (filters.rating) {
    conditions.push({ averageRating: { gte: filters.rating } })
  }

  return conditions.length > 0 ? { AND: conditions } : {}
}

export const fetchCourseList = async (
  filters: CourseFilters = {},
  pagination: PaginationParams = {}
) => {
  const {
    page = 1,
    pageSize = 12,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = pagination

  const whereClause = buildCourseWhereClause(filters)
  const skipAmount = (page - 1) * pageSize

  const [courseList, totalRecords] = await Promise.all([
    dbService.getPrisma().course.findMany({
      where: whereClause,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        modules: {
          include: {
            chapters: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: skipAmount,
      take: pageSize
    }),
    dbService.getPrisma().course.count({ where: whereClause })
  ])

  return {
    courses: courseList,
    totalCount: totalRecords,
    currentPage: page,
    totalPages: Math.ceil(totalRecords / pageSize),
    hasNextPage: page * pageSize < totalRecords,
    hasPreviousPage: page > 1
  }
}

export const retrieveCourseDetails = async (courseId: string, userId?: string) => {
  const courseData = await dbService.getPrisma().course.findUnique({
    where: { id: courseId },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      modules: {
        include: {
          chapters: {
            include: {
              sections: {
                include: {
                  quiz: {
                    include: {
                      questions: true
                    }
                  }
                }
              }
            },
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { order: 'asc' }
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      _count: {
        select: {
          enrollments: true,
          reviews: true
        }
      }
    }
  })

  if (!courseData) {
    return null
  }

  let enrollmentInfo = null
  if (userId) {
    enrollmentInfo = await dbService.getPrisma().courseEnrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId
        }
      },
      include: {
        chapterProgress: true
      }
    })
  }

  const completedChapterIds = new Set(
    enrollmentInfo?.chapterProgress
      ?.filter(p => p.isCompleted)
      ?.map(p => p.chapterId) || []
  )

  const enrichedModules = courseData.modules.map(mod => ({
    ...mod,
    chapters: mod.chapters.map(ch => ({
      ...ch,
      isCompleted: completedChapterIds.has(ch.id)
    }))
  }))

  return {
    ...courseData,
    modules: enrichedModules,
    isEnrolled: !!enrollmentInfo,
    userProgress: enrollmentInfo?.progress || 0,
    enrollmentDetails: enrollmentInfo
  }
}

export const createNewCourse = async (instructorId: string, courseData: any) => {
  const slugValue = courseData.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now()

  return await dbService.getPrisma().course.create({
    data: {
      userId: instructorId,
      title: courseData.title,
      slug: slugValue,
      description: courseData.description,
      shortDescription: courseData.shortDescription,
      courseImage: courseData.courseImage,
      category: courseData.category,
      difficulty: courseData.difficulty || 'beginner',
      language: courseData.language || 'en',
      learningObjectives: courseData.learningObjectives,
      requirements: courseData.requirements || '[]',
      price: courseData.price || 0,
      currency: courseData.currency || 'USD',
      isPaid: courseData.isPaid || false,
      status: courseData.status || 'draft',
      isDraft: courseData.isDraft !== false
    },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      }
    }
  })
}

export const modifyCourseData = async (courseId: string, updateData: any) => {
  const fieldsToUpdate: any = {}

  const allowedFields = [
    'title', 'description', 'shortDescription', 'courseImage',
    'category', 'difficulty', 'language', 'learningObjectives',
    'requirements', 'price', 'currency', 'isPaid', 'status', 'isDraft'
  ]

  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      fieldsToUpdate[field] = updateData[field]
    }
  })

  if (updateData.status === 'published' && updateData.publishedAt === undefined) {
    fieldsToUpdate.publishedAt = new Date()
    fieldsToUpdate.isDraft = false
  }

  return await dbService.getPrisma().course.update({
    where: { id: courseId },
    data: fieldsToUpdate,
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      }
    }
  })
}

export const removeCourse = async (courseId: string) => {
  return await dbService.getPrisma().course.delete({
    where: { id: courseId }
  })
}

export const verifyInstructorAccess = async (courseId: string, instructorId: string) => {
  const courseRecord = await dbService.getPrisma().course.findFirst({
    where: {
      id: courseId,
      userId: instructorId
    }
  })

  return !!courseRecord
}

export const updateCourseStatistics = async (courseId: string) => {
  const [enrollmentTotal, reviewData] = await Promise.all([
    dbService.getPrisma().courseEnrollment.count({
      where: { courseId }
    }),
    dbService.getPrisma().courseReview.aggregate({
      where: { courseId },
      _avg: { rating: true },
      _count: { rating: true }
    })
  ])

  return await dbService.getPrisma().course.update({
    where: { id: courseId },
    data: {
      enrollmentCount: enrollmentTotal,
      averageRating: reviewData._avg.rating || 0,
      ratingCount: reviewData._count.rating
    }
  })
}

export const calculateChapterCount = async (courseId: string) => {
  const moduleList = await dbService.getPrisma().courseModule.findMany({
    where: { courseId },
    include: {
      chapters: true
    }
  })

  return moduleList.reduce((sum, mod) => sum + mod.chapters.length, 0)
}

export const getUserEnrollments = async (userId: string) => {
  const enrollments = await dbService.getPrisma().courseEnrollment.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          courseImage: true,
          category: true,
          instructor: {
            select: { name: true }
          },
          modules: {
            select: {
              chapters: true // Needed for lesson counting logic
            }
          }
        }
      }
    },
    orderBy: { lastAccessedAt: 'desc' }
  })

  return enrollments
}
