/**
 * Session validation utilities for Drive
 * Ensures proper authentication and authorization
 */

import { Session } from 'next-auth'

export interface ValidatedUser {
    id: string
    email: string
    name?: string
}

export class AuthError extends Error {
    constructor(message: string = 'Authentication required') {
        super(message)
        this.name = 'AuthError'
    }
}

/**
 * Validate and extract user from session
 */
export function validateSession(session: Session | null): ValidatedUser {
    if (!session) {
        throw new AuthError('No session found')
    }

    if (!session.user) {
        throw new AuthError('Session has no user')
    }

    const user = session.user as any

    if (!user.id || typeof user.id !== 'string') {
        throw new AuthError('Session user has no valid ID')
    }

    if (!user.email || typeof user.email !== 'string') {
        throw new AuthError('Session user has no valid email')
    }

    return {
        id: user.id,
        email: user.email,
        name: user.name || undefined
    }
}

/**
 * Check if user has access to drive
 */
export async function validateDriveAccess(
    userId: string,
    driveId: string,
    prisma: any
): Promise<boolean> {
    const drive = await prisma.drive.findUnique({
        where: { id: driveId },
        select: { userId: true }
    })

    if (!drive) {
        return false
    }

    return drive.userId === userId
}

/**
 * Check if user owns a file
 */
export async function validateFileOwnership(
    userId: string,
    fileId: string,
    prisma: any
): Promise<boolean> {
    const file = await prisma.driveFile.findUnique({
        where: { id: fileId },
        include: {
            drive: {
                select: { userId: true }
            }
        }
    })

    if (!file) {
        return false
    }

    return file.drive.userId === userId
}

/**
 * Check if user owns a folder
 */
export async function validateFolderOwnership(
    userId: string,
    folderId: string,
    prisma: any
): Promise<boolean> {
    const folder = await prisma.driveFolder.findUnique({
        where: { id: folderId },
        include: {
            drive: {
                select: { userId: true }
            }
        }
    })

    if (!folder) {
        return false
    }

    return folder.drive.userId === userId
}
