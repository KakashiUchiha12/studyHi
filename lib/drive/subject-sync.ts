// Subject-Drive synchronization utilities
import { prisma } from '@/lib/prisma';

/**
 * Auto-create Drive folder when a subject is created
 */
export async function createDriveFolderForSubject(data: {
    userId: string;
    subjectId: string;
    subjectName: string;
}) {
    // Get user's drive
    const drive = await prisma.drive.findUnique({
        where: { userId: data.userId },
    });

    if (!drive) {
        throw new Error('User drive not found');
    }

    // Create folder for subject with "Subjects" prefix
    const folderName = `Subjects - ${data.subjectName}`;
    const folder = await prisma.driveFolder.create({
        data: {
            driveId: drive.id,
            name: folderName,
            path: `/${folderName}`,
            subjectId: data.subjectId,
            isPublic: false, // Default to private
        },
    });

    return folder;
}

/**
 * Sync subject files to Drive folder
 */
export async function syncSubjectFilesToDrive(data: {
    userId: string;
    subjectId: string;
}) {
    // Get subject folder
    const folder = await prisma.driveFolder.findFirst({
        where: {
            subjectId: data.subjectId,
            drive: {
                userId: data.userId,
            },
        },
    });

    if (!folder) {
        throw new Error('Subject folder not found in Drive');
    }

    // Get subject files
    const subjectFiles = await prisma.subjectFile.findMany({
        where: {
            subject: {
                id: data.subjectId,
                userId: data.userId,
            },
        },
    });

    // Sync files to Drive (if not already there)
    const syncedFiles = [];
    for (const subjectFile of subjectFiles) {
        // Check if file already exists in Drive
        const existingFile = await prisma.driveFile.findFirst({
            where: {
                folderId: folder.id,
                originalName: subjectFile.originalName,
            },
        });

        if (!existingFile) {
            // Create Drive file entry
            const driveFile = await prisma.driveFile.create({
                data: {
                    driveId: folder.driveId,
                    folderId: folder.id,
                    originalName: subjectFile.originalName,
                    storedName: subjectFile.fileName, // Use fileName as storedName
                    fileSize: BigInt(subjectFile.fileSize),
                    mimeType: subjectFile.mimeType,
                    fileType: subjectFile.fileType,
                    fileHash: '', // Calculate hash if needed
                    filePath: subjectFile.filePath,
                    thumbnailPath: subjectFile.thumbnailPath,
                    isPublic: subjectFile.isPublic,
                },
            });
            syncedFiles.push(driveFile);
        }
    }

    return { synced: syncedFiles.length, total: subjectFiles.length };
}

/**
 * Update Drive folder when subject is renamed
 */
export async function updateDriveFolderForSubject(data: {
    subjectId: string;
    newName: string;
}) {
    const folder = await prisma.driveFolder.findFirst({
        where: { subjectId: data.subjectId },
    });

    if (!folder) return null;

    // Update folder name and path with "Subjects" prefix
    const newFolderName = `Subjects - ${data.newName}`;
    const updatedFolder = await prisma.driveFolder.update({
        where: { id: folder.id },
        data: {
            name: newFolderName,
            path: `/${newFolderName}`,
        },
    });

    return updatedFolder;
}

/**
 * Delete Drive folder when subject is deleted
 */
export async function deleteDriveFolderForSubject(subjectId: string) {
    const folder = await prisma.driveFolder.findFirst({
        where: { subjectId },
    });

    if (!folder) return null;

    // Soft delete folder (moves to trash)
    const deletedFolder = await prisma.driveFolder.update({
        where: { id: folder.id },
        data: {
            deletedAt: new Date(),
        },
    });

    return deletedFolder;
}

/**
 * Get Drive folder for a subject
 */
export async function getDriveFolderForSubject(data: {
    userId: string;
    subjectId: string;
}) {
    const folder = await prisma.driveFolder.findFirst({
        where: {
            subjectId: data.subjectId,
            drive: {
                userId: data.userId,
            },
        },
        include: {
            _count: {
                select: {
                    files: true,
                },
            },
        },
    });

    return folder;
}
