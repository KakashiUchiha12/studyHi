import { dbService } from '@/lib/database'

export const registerStudentEnrollment = async (courseId: string, studentId: string) => {
  const existingRecord = await dbService.getPrisma().courseEnrollment.findUnique({
    where: {
      courseId_userId: {
        courseId,
        userId: studentId
      }
    }
  })

  if (existingRecord) {
    return existingRecord
  }

  return await dbService.getPrisma().courseEnrollment.create({
    data: {
      courseId,
      userId: studentId,
      progress: 0,
      enrolledAt: new Date(),
      lastAccessedAt: new Date()
    }
  })
}

export const removeStudentEnrollment = async (courseId: string, studentId: string) => {
  return await dbService.getPrisma().courseEnrollment.delete({
    where: {
      courseId_userId: {
        courseId,
        userId: studentId
      }
    }
  })
}

export const markChapterAsComplete = async (
  enrollmentId: string,
  chapterId: string,
  studentId: string
) => {
  const existingProgress = await dbService.getPrisma().chapterProgress.findUnique({
    where: {
      enrollmentId_chapterId: {
        enrollmentId,
        chapterId
      }
    }
  })

  let progressRecord
  if (existingProgress) {
    progressRecord = await dbService.getPrisma().chapterProgress.update({
      where: {
        enrollmentId_chapterId: {
          enrollmentId,
          chapterId
        }
      },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        lastAccessedAt: new Date()
      }
    })
  } else {
    progressRecord = await dbService.getPrisma().chapterProgress.create({
      data: {
        enrollmentId,
        chapterId,
        userId: studentId,
        isCompleted: true,
        completedAt: new Date(),
        lastAccessedAt: new Date()
      }
    })
  }

  await recalculateEnrollmentProgress(enrollmentId)
  return progressRecord
}

export const recalculateEnrollmentProgress = async (enrollmentId: string) => {
  const enrollmentData = await dbService.getPrisma().courseEnrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        include: {
          modules: {
            include: {
              chapters: true
            }
          }
        }
      },
      chapterProgress: true
    }
  })

  if (!enrollmentData) {
    throw new Error('Enrollment not found')
  }

  const totalChaptersInCourse = enrollmentData.course.modules.reduce(
    (total, module) => total + module.chapters.length,
    0
  )

  const completedChaptersCount = enrollmentData.chapterProgress.filter(
    p => p.isCompleted
  ).length

  const progressPercentage = totalChaptersInCourse > 0
    ? (completedChaptersCount / totalChaptersInCourse) * 100
    : 0

  const isFullyComplete = progressPercentage === 100

  return await dbService.getPrisma().courseEnrollment.update({
    where: { id: enrollmentId },
    data: {
      progress: progressPercentage,
      completedAt: isFullyComplete ? new Date() : null,
      lastAccessedAt: new Date()
    }
  })
}

export const fetchStudentProgress = async (courseId: string, studentId: string) => {
  const enrollmentRecord = await dbService.getPrisma().courseEnrollment.findUnique({
    where: {
      courseId_userId: {
        courseId,
        userId: studentId
      }
    },
    include: {
      chapterProgress: {
        include: {
          chapter: {
            include: {
              module: true
            }
          }
        }
      }
    }
  })

  if (!enrollmentRecord) {
    return null
  }

  const courseDetails = await dbService.getPrisma().course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: {
          chapters: true
        },
        orderBy: { order: 'asc' }
      }
    }
  })

  const totalChapters = courseDetails?.modules.reduce(
    (sum, mod) => sum + mod.chapters.length,
    0
  ) || 0

  const completedChapters = enrollmentRecord.chapterProgress.filter(
    p => p.isCompleted
  ).length

  return {
    enrollmentId: enrollmentRecord.id,
    progress: enrollmentRecord.progress,
    totalChapters,
    completedChapters,
    completedAt: enrollmentRecord.completedAt,
    lastAccessedAt: enrollmentRecord.lastAccessedAt,
    chapterDetails: enrollmentRecord.chapterProgress
  }
}

export const updateLastAccessTime = async (enrollmentId: string) => {
  return await dbService.getPrisma().courseEnrollment.update({
    where: { id: enrollmentId },
    data: {
      lastAccessedAt: new Date()
    }
  })
}

export const retrieveEnrollmentByIdentifiers = async (courseId: string, studentId: string) => {
  return await dbService.getPrisma().courseEnrollment.findUnique({
    where: {
      courseId_userId: {
        courseId,
        userId: studentId
      }
    }
  })
}

export const fetchEnrolledStudentsList = async (courseId: string, pagination?: { skip?: number, take?: number }) => {
  const { skip = 0, take = 50 } = pagination || {}

  const studentList = await dbService.getPrisma().courseEnrollment.findMany({
    where: { courseId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      chapterProgress: {
        where: { isCompleted: true }
      }
    },
    orderBy: { enrolledAt: 'desc' },
    skip,
    take
  })

  const totalStudents = await dbService.getPrisma().courseEnrollment.count({
    where: { courseId }
  })

  return {
    students: studentList,
    total: totalStudents
  }
}

export const computeCourseAnalytics = async (courseId: string) => {
  const [
    totalEnrollments,
    completedEnrollments,
    averageProgressData,
    recentEnrollments
  ] = await Promise.all([
    dbService.getPrisma().courseEnrollment.count({
      where: { courseId }
    }),
    dbService.getPrisma().courseEnrollment.count({
      where: {
        courseId,
        completedAt: { not: null }
      }
    }),
    dbService.getPrisma().courseEnrollment.aggregate({
      where: { courseId },
      _avg: { progress: true }
    }),
    dbService.getPrisma().courseEnrollment.count({
      where: {
        courseId,
        enrolledAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })
  ])

  const completionRate = totalEnrollments > 0
    ? (completedEnrollments / totalEnrollments) * 100
    : 0

  return {
    totalEnrollments,
    completedEnrollments,
    completionRate,
    averageProgress: averageProgressData._avg.progress || 0,
    recentEnrollments
  }
}
