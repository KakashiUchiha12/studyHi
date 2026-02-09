import { prisma } from "@/lib/prisma";

export async function getUserClassRole(userId: string, classId: string): Promise<string | null> {
  const member = await prisma.classMember.findUnique({
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
  });

  if (!member || member.status !== "approved") {
    return null;
  }

  return member.role;
}

export async function isClassMember(userId: string, classId: string): Promise<boolean> {
  const member = await prisma.classMember.findUnique({
    where: {
      classId_userId: {
        classId,
        userId,
      },
    },
    select: {
      status: true,
    },
  });

  return member?.status === "approved";
}

export async function isTeacherOrAdmin(userId: string, classId: string): Promise<boolean> {
  const role = await getUserClassRole(userId, classId);
  return role === "teacher" || role === "admin";
}

export async function isClassAdmin(userId: string, classId: string): Promise<boolean> {
  const role = await getUserClassRole(userId, classId);
  return role === "admin";
}

export async function canManageAssignments(userId: string, classId: string): Promise<boolean> {
  return await isTeacherOrAdmin(userId, classId);
}

export async function canGradeAssignments(userId: string, classId: string): Promise<boolean> {
  return await isTeacherOrAdmin(userId, classId);
}

export async function canManageMembers(userId: string, classId: string): Promise<boolean> {
  return await isClassAdmin(userId, classId);
}

export async function canPinPosts(userId: string, classId: string): Promise<boolean> {
  return await isTeacherOrAdmin(userId, classId);
}

export async function canDeletePost(userId: string, classId: string, postUserId: string): Promise<boolean> {
  if (userId === postUserId) {
    return true;
  }
  return await isTeacherOrAdmin(userId, classId);
}

// File upload validation
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

// Generate a unique invite code
export function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
