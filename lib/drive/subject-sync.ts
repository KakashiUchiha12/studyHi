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
 * Sync subject files to Drive folder hierarchy
 */
export async function syncSubjectFilesToDrive(data: {
    userId: string;
    subjectId: string;
}) {
    // Get subject folder
    const subjectFolder = await prisma.driveFolder.findFirst({
        where: {
            subjectId: data.subjectId,
            drive: {
                userId: data.userId,
            },
            deletedAt: null
        },
    });

    if (!subjectFolder) {
        throw new Error('Subject folder not found in Drive');
    }

    // Get subject and its hierarchy
    const subject = await prisma.subject.findUnique({
        where: { id: data.subjectId },
        include: {
            chapters: {
                include: {
                    materials: true
                }
            },
            files: true
        }
    });

    if (!subject) throw new Error('Subject not found');

    const syncedFiles = [];
    const driveId = subjectFolder.driveId;

    // 1. Sync standalone SubjectFiles to the root subject folder
    for (const sFile of subject.files) {
        const existingFile = await prisma.driveFile.findFirst({
            where: {
                folderId: subjectFolder.id,
                originalName: sFile.originalName,
                deletedAt: null
            },
        });

        if (!existingFile) {
            // GLOBAL CHECK: Does this file (by storedName) already exist anywhere in the system?
            // DriveFile storedName is a Unique UUID, so it must be globally unique.
            const globallyExists = await prisma.driveFile.findUnique({
                where: { storedName: sFile.fileName }
            });

            if (globallyExists) {
                // If it exists but in a different folder/drive, we can link it if it belongs to the same drive,
                // or just skip if we don't want to duplicate logic here.
                if (globallyExists.driveId === driveId && globallyExists.folderId === subjectFolder.id) {
                    continue; // Already there
                }

                // If it's in the same drive but root, move it? 
                // For now, let's just make it robust.
                continue;
            }

            const driveFile = await prisma.driveFile.create({
                data: {
                    driveId,
                    folderId: subjectFolder.id,
                    originalName: sFile.originalName,
                    storedName: sFile.fileName,
                    fileSize: BigInt(sFile.fileSize),
                    mimeType: sFile.mimeType,
                    fileType: sFile.fileType,
                    fileHash: '',
                    filePath: sFile.filePath,
                    thumbnailPath: sFile.thumbnailPath,
                    isPublic: sFile.isPublic,
                },
            });
            syncedFiles.push(driveFile);
        }
    }

    // 2. Sync Chapter -> Material files
    for (const chapter of subject.chapters) {
        const chapterFolder = await ensureFolderExists(driveId, subjectFolder.id, chapter.title);
        for (const material of chapter.materials) {
            await syncMaterialToFolder(driveId, subjectFolder.id, chapterFolder.id, material, syncedFiles);
        }
    }

    // 3. Sync Subject-level Materials (Chapter-less)
    const standaloneMaterials = await prisma.material.findMany({
        where: { subjectId: data.subjectId, chapterId: null }
    });

    for (const material of standaloneMaterials) {
        await syncMaterialToFolder(driveId, subjectFolder.id, subjectFolder.id, material, syncedFiles);
    }

    return { synced: syncedFiles.length, total: syncedFiles.length };
}

/**
 * Helper to sync a material (and its files) to a specific parent folder in Drive
 */
async function syncMaterialToFolder(
    driveId: string,
    subjectRootFolderId: string,
    parentFolderId: string,
    material: any,
    syncedFiles: any[]
) {
    if (!material.content) return;

    try {
        const parsed = JSON.parse(material.content);
        const files = parsed.files || [];
        if (files.length === 0) return;

        // Ensure Material subfolder exists
        const materialFolder = await ensureFolderExists(driveId, parentFolderId, material.title);

        for (const f of files) {
            // Check if already in this folder
            const existingInTarget = await prisma.driveFile.findFirst({
                where: { folderId: materialFolder.id, originalName: f.name, deletedAt: null }
            });
            if (existingInTarget) {
                // Also check if matches by storedName to be absolutely sure
                const srcFile = await prisma.driveFile.findUnique({ where: { id: f.id } })
                    || await prisma.subjectFile.findUnique({ where: { id: f.id } });
                if (srcFile) {
                    const sName = (srcFile as any).storedName || (srcFile as any).fileName;
                    if (existingInTarget.storedName === sName) continue;
                } else {
                    continue;
                }
            }

            // Robust Match: Find if this file exists anywhere else in the Drive
            // First by direct ID match (id might be DriveFile or SubjectFile)
            // Then by storedName (UUID path)
            const sourceInfo = await prisma.driveFile.findUnique({ where: { id: f.id } })
                || await prisma.subjectFile.findUnique({ where: { id: f.id } });

            if (!sourceInfo) continue;

            const storedName = (sourceInfo as any).storedName || (sourceInfo as any).fileName;

            // Find if this specific stored file is already in the Drive (in Root or elsewhere)
            const existingDriveFile = await prisma.driveFile.findFirst({
                where: { driveId, storedName, deletedAt: null }
            });

            if (existingDriveFile) {
                // MOVE it to this material folder
                const moved = await prisma.driveFile.update({
                    where: { id: existingDriveFile.id },
                    data: { folderId: materialFolder.id }
                });
                syncedFiles.push(moved);
            } else {
                // CREATE new entry in Drive
                const newlyCreated = await prisma.driveFile.create({
                    data: {
                        driveId,
                        folderId: materialFolder.id,
                        originalName: sourceInfo.originalName,
                        storedName: storedName,
                        fileSize: BigInt(sourceInfo.fileSize),
                        mimeType: sourceInfo.mimeType,
                        fileType: sourceInfo.fileType,
                        fileHash: (sourceInfo as any).fileHash || '',
                        filePath: sourceInfo.filePath,
                        thumbnailPath: sourceInfo.thumbnailPath,
                        isPublic: false,
                    }
                });
                syncedFiles.push(newlyCreated);
            }
        }
    } catch (e) {
        console.error(`Error syncing material ${material.title}:`, e);
    }
}

/**
 * Helper to ensure a folder exists in Drive
 */
async function ensureFolderExists(driveId: string, parentId: string, name: string) {
    let folder = await prisma.driveFolder.findFirst({
        where: { driveId, parentId, name, deletedAt: null }
    });

    if (!folder) {
        const parent = await prisma.driveFolder.findUnique({ where: { id: parentId } });
        const path = parent ? `${parent.path}/${name}` : `/${name}`;

        folder = await prisma.driveFolder.create({
            data: {
                driveId,
                parentId,
                name,
                path,
                isPublic: false
            }
        });
    }

    return folder;
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
