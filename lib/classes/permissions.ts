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
      select: {
        role: true,
        status: true,
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
      select: {
        role: true,
        status: true,
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
  // Teacher role now inherits all Admin capabilities
  return checkClassRole(classId, userId, ['admin', 'teacher'])
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

// --- Specific Permissions (from Feature Branch) ---

export async function canCreateAssignments(userId: string, classId: string): Promise<boolean> {
  // Both teachers and admins can create assignments
  return await isTeacherOrAdmin(classId, userId);
}

export async function canEditAssignments(userId: string, classId: string): Promise<boolean> {
  // Only teachers can edit assignments
  return await checkClassRole(classId, userId, ['teacher']);
}

// Legacy alias for backward compatibility
export async function canManageAssignments(userId: string, classId: string): Promise<boolean> {
  // Redirects to canCreateAssignments for compatibility
  return await canCreateAssignments(userId, classId);
}

export async function canViewSubmissions(userId: string, classId: string): Promise<boolean> {
  // Only teachers can view submissions
  return await checkClassRole(classId, userId, ['teacher']);
}

export async function canGradeAssignments(userId: string, classId: string): Promise<boolean> {
  // Only teachers can grade assignments
  return await checkClassRole(classId, userId, ['teacher']);
}

export async function canManageMembers(userId: string, classId: string): Promise<boolean> {
  return await isClassAdmin(classId, userId);
}

export async function canPinPosts(userId: string, classId: string): Promise<boolean> {
  return await isTeacherOrAdmin(classId, userId);
}

export async function canDeletePost(userId: string, classId: string, postUserId: string): Promise<boolean> {
  if (userId === postUserId) {
    return true;
  }
  return await isTeacherOrAdmin(classId, userId);
}

// --- File Validation (from Feature Branch) ---

export const MAX_FILE_SIZE = 256 * 1024 * 1024; // 256MB in bytes

export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE;
}

export function validateFileType(type: string): boolean {
  const allowedTypes = [
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Videos
    "video/mp4",
    "video/webm",
    "video/ogg",
    // Archives
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
  ];

  return allowedTypes.includes(type);
}

// --- Join Code Generation (from HEAD) ---

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
    // Default to false on error to prevent duplicates
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
