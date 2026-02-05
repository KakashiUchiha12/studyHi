import { dbService } from '@/lib/database'

interface BadgeCriteria {
  type: 'enrollment' | 'completion' | 'quiz_score' | 'course_count' | 'streak'
  value?: number
  courseId?: string
}

export const awardStudentBadge = async (userId: string, achievementId: string) => {
  const existingBadge = await dbService.getPrisma().userBadge.findUnique({
    where: {
      userId_achievementId: {
        userId,
        achievementId
      }
    }
  })

  if (existingBadge) {
    return existingBadge
  }

  return await dbService.getPrisma().userBadge.create({
    data: {
      userId,
      achievementId,
      isVisible: true,
      earnedAt: new Date()
    },
    include: {
      achievement: true
    }
  })
}

export const evaluateBadgeEligibility = async (userId: string, courseId?: string) => {
  const achievementsList = await dbService.getPrisma().courseAchievement.findMany({
    where: courseId ? { courseId } : {}
  })

  const earnedBadges: any[] = []

  for (const achievement of achievementsList) {
    const criteriaData: BadgeCriteria = JSON.parse(achievement.criteria)
    const isQualified = await verifyBadgeCriteria(userId, criteriaData)

    if (isQualified) {
      const existingBadge = await dbService.getPrisma().userBadge.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievement.id
          }
        }
      })

      if (!existingBadge) {
        const newBadge = await awardStudentBadge(userId, achievement.id)
        earnedBadges.push(newBadge)
      }
    }
  }

  return earnedBadges
}

const verifyBadgeCriteria = async (userId: string, criteria: BadgeCriteria): Promise<boolean> => {
  switch (criteria.type) {
    case 'enrollment':
      if (criteria.courseId) {
        const enrollment = await dbService.getPrisma().courseEnrollment.findUnique({
          where: {
            courseId_userId: {
              courseId: criteria.courseId,
              userId
            }
          }
        })
        return !!enrollment
      }
      return false

    case 'completion':
      if (criteria.courseId) {
        const enrollment = await dbService.getPrisma().courseEnrollment.findFirst({
          where: {
            courseId: criteria.courseId,
            userId,
            completedAt: { not: null }
          }
        })
        return !!enrollment
      }
      return false

    case 'quiz_score':
      if (criteria.courseId && criteria.value) {
        const quizAttempts = await dbService.getPrisma().quizAttempt.findMany({
          where: {
            userId,
            quiz: {
              section: {
                chapter: {
                  module: {
                    courseId: criteria.courseId
                  }
                }
              }
            }
          }
        })
        
        const hasHighScore = quizAttempts.some(attempt => attempt.score >= criteria.value!)
        return hasHighScore
      }
      return false

    case 'course_count':
      if (criteria.value) {
        const completedCount = await dbService.getPrisma().courseEnrollment.count({
          where: {
            userId,
            completedAt: { not: null }
          }
        })
        return completedCount >= criteria.value
      }
      return false

    case 'streak':
      return false

    default:
      return false
  }
}

export const fetchUserBadgeCollection = async (userId: string) => {
  const badgeList = await dbService.getPrisma().userBadge.findMany({
    where: {
      userId,
      isVisible: true
    },
    include: {
      achievement: true
    },
    orderBy: {
      earnedAt: 'desc'
    }
  })

  return badgeList
}

export const modifyBadgeVisibility = async (badgeId: string, isVisible: boolean) => {
  return await dbService.getPrisma().userBadge.update({
    where: { id: badgeId },
    data: { isVisible }
  })
}

export const registerCourseAchievement = async (achievementData: {
  courseId?: string
  badgeType: string
  title: string
  description: string
  icon: string
  criteria: BadgeCriteria
}) => {
  return await dbService.getPrisma().courseAchievement.create({
    data: {
      courseId: achievementData.courseId,
      badgeType: achievementData.badgeType,
      title: achievementData.title,
      description: achievementData.description,
      icon: achievementData.icon,
      criteria: JSON.stringify(achievementData.criteria)
    }
  })
}

export const initializeDefaultBadges = async (courseId: string) => {
  const defaultBadges = [
    {
      courseId,
      badgeType: 'enrollment',
      title: 'First Step',
      description: 'Enrolled in the course',
      icon: '🎓',
      criteria: { type: 'enrollment' as const, courseId }
    },
    {
      courseId,
      badgeType: 'completion',
      title: 'Course Champion',
      description: 'Completed the entire course',
      icon: '🏆',
      criteria: { type: 'completion' as const, courseId }
    },
    {
      courseId,
      badgeType: 'quiz_master',
      title: 'Quiz Master',
      description: 'Scored 90% or higher on any quiz',
      icon: '⭐',
      criteria: { type: 'quiz_score' as const, courseId, value: 90 }
    }
  ]

  const createdBadges = []
  for (const badge of defaultBadges) {
    const created = await registerCourseAchievement(badge)
    createdBadges.push(created)
  }

  return createdBadges
}

export const retrieveCourseBadges = async (courseId: string) => {
  return await dbService.getPrisma().courseAchievement.findMany({
    where: { courseId }
  })
}

export const checkEnrollmentBadge = async (userId: string, courseId: string) => {
  const badges = await dbService.getPrisma().courseAchievement.findMany({
    where: {
      courseId,
      badgeType: 'enrollment'
    }
  })

  for (const badge of badges) {
    await awardStudentBadge(userId, badge.id)
  }
}

export const checkCompletionBadge = async (userId: string, courseId: string) => {
  const badges = await dbService.getPrisma().courseAchievement.findMany({
    where: {
      courseId,
      badgeType: 'completion'
    }
  })

  for (const badge of badges) {
    await awardStudentBadge(userId, badge.id)
  }
}
