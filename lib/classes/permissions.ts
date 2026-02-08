import { dbService } from '@/lib/database'

export type ClassRole = 'admin' | 'teacher' | 'student'

export interface ClassMemberWithRole {
  id: string
  classId: string
  userId: string
  role: ClassRole
  status: string
  joinedAt: Date
  mutedNotifications: boolean
}

/**
 * Check if a user has a specific role in a class
 */
export async function checkClassRole(
  classId: string,
  userId: string,
  allowedRoles: ClassRole[]
): Promise<boolean> {
  try {
    const member = await dbService.getPrisma().classMember.findUnique({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
    })

    if (!member || member.status !== 'approved') {
      return false
    }

    return allowedRoles.includes(member.role as ClassRole)
  } catch (error) {
    console.error('Error checking class role:', error)
    return false
  }
}

/**
 * Get user's role in a class
 */
export async function getUserClassRole(
  classId: string,
  userId: string
): Promise<ClassRole | null> {
  try {
    const member = await dbService.getPrisma().classMember.findUnique({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
    })

    if (!member || member.status !== 'approved') {
      return null
    }

    return member.role as ClassRole
  } catch (error) {
    console.error('Error getting user class role:', error)
    return null
  }
}

/**
 * Check if user is admin in a class
 */
export async function isClassAdmin(
  classId: string,
  userId: string
): Promise<boolean> {
  return checkClassRole(classId, userId, ['admin'])
}

/**
 * Check if user is teacher or admin in a class
 */
export async function isTeacherOrAdmin(
  classId: string,
  userId: string
): Promise<boolean> {
  return checkClassRole(classId, userId, ['admin', 'teacher'])
}

/**
 * Check if user is a member of a class (any role, approved status)
 */
export async function isClassMember(
  classId: string,
  userId: string
): Promise<boolean> {
  return checkClassRole(classId, userId, ['admin', 'teacher', 'student'])
}

/**
 * Generate a unique 6-character join code
 */
export function generateJoinCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}

/**
 * Check if a join code is unique
 */
export async function isJoinCodeUnique(code: string): Promise<boolean> {
  try {
    const existing = await dbService.getPrisma().class.findUnique({
      where: { joinCode: code },
    })
    return !existing
  } catch (error) {
    console.error('Error checking join code uniqueness:', error)
    return false
  }
}

/**
 * Generate a unique join code
 */
export async function generateUniqueJoinCode(): Promise<string> {
  let code = generateJoinCode()
  let attempts = 0
  const maxAttempts = 10

  while (!(await isJoinCodeUnique(code)) && attempts < maxAttempts) {
    code = generateJoinCode()
    attempts++
  }

  if (attempts >= maxAttempts) {
    throw new Error('Failed to generate unique join code')
  }

  return code
}
