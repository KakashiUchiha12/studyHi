import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/drive/folders/[id]/copy
 * Copy a folder with all its contents
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: folderId } = await params;
        const body = await request.json();
        const { targetParentId, newName } = body;

        // Get source folder and verify ownership
        const sourceFolder = await prisma.driveFolder.findUnique({
            where: { id: folderId },
            include: {
                drive: {
                    select: {
                        userId: true,
                        id: true,
                    },
                },
                files: {
                    where: { deletedAt: null },
                },
                children: {
                    where: { deletedAt: null },
                },
            },
        });

        if (!sourceFolder || sourceFolder.deletedAt) {
            return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
        }

        if (sourceFolder.drive.userId !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Determine target parent path
        let targetParentPath = '';
        if (targetParentId) {
            const targetParent = await prisma.driveFolder.findFirst({
                where: {
                    id: targetParentId,
                    driveId: sourceFolder.driveId,
                    deletedAt: null,
                },
            });

            if (!targetParent) {
                return NextResponse.json(
                    { error: 'Target parent folder not found' },
                    { status: 404 }
                );
            }
            targetParentPath = targetParent.path;
        }

        // Generate new folder name
        const copyName = newName || `${sourceFolder.name} (Copy)`;
        const copyPath = targetParentPath ? `${targetParentPath}/${copyName}` : copyName;

        // Check if folder with same name exists
        const existingFolder = await prisma.driveFolder.findFirst({
            where: {
                driveId: sourceFolder.driveId,
                parentId: targetParentId || null,
                name: copyName,
                deletedAt: null,
            },
        });

        if (existingFolder) {
            return NextResponse.json(
                { error: 'Folder with this name already exists in target location' },
                { status: 409 }
            );
        }

        // Copy folder recursively
        const copiedFolder = await copyFolderRecursive({
            sourceFolder,
            driveId: sourceFolder.driveId,
            parentId: targetParentId || null,
            parentPath: targetParentPath,
            newName: copyName,
        });

        // Create activity log
        await prisma.driveActivity.create({
            data: {
                driveId: sourceFolder.driveId,
                userId: session.user.id,
                action: 'copy',
                targetType: 'folder',
                targetId: copiedFolder.id,
                targetName: copyName,
                metadata: JSON.stringify({
                    sourceId: folderId,
                    sourceName: sourceFolder.name,
                    targetParentId,
                }),
            },
        });

        return NextResponse.json({ folder: copiedFolder }, { status: 201 });
    } catch (error) {
        console.error('Error copying folder:', error);
        return NextResponse.json(
            { error: 'Failed to copy folder' },
            { status: 500 }
        );
    }
}

/**
 * Helper function to recursively copy folder and its contents
 */
async function copyFolderRecursive({
    sourceFolder,
    driveId,
    parentId,
    parentPath,
    newName,
}: {
    sourceFolder: any;
    driveId: string;
    parentId: string | null;
    parentPath: string;
    newName?: string;
}): Promise<any> {
    const folderName = newName || sourceFolder.name;
    const folderPath = parentPath ? `${parentPath}/${folderName}` : folderName;

    // Create new folder
    const newFolder = await prisma.driveFolder.create({
        data: {
            driveId,
            parentId,
            name: folderName,
            path: folderPath,
            isPublic: sourceFolder.isPublic,
            subjectId: null, // Don't copy subject association
        },
    });

    // Get all files and subfolders from source
    const [files, subfolders] = await Promise.all([
        prisma.driveFile.findMany({
            where: {
                folderId: sourceFolder.id,
                deletedAt: null,
            },
        }),
        prisma.driveFolder.findMany({
            where: {
                parentId: sourceFolder.id,
                deletedAt: null,
            },
            include: {
                files: {
                    where: { deletedAt: null },
                },
                children: {
                    where: { deletedAt: null },
                },
            },
        }),
    ]);

    // Copy all files
    for (const file of files) {
        await prisma.driveFile.create({
            data: {
                driveId,
                folderId: newFolder.id,
                originalName: file.originalName,
                storedName: file.storedName, // Reuse same stored file
                fileSize: file.fileSize,
                mimeType: file.mimeType,
                fileType: file.fileType,
                fileHash: file.fileHash,
                filePath: file.filePath,
                thumbnailPath: file.thumbnailPath,
                isPublic: file.isPublic,
                description: file.description,
                tags: file.tags,
            },
        });
    }

    // Recursively copy subfolders
    for (const subfolder of subfolders) {
        await copyFolderRecursive({
            sourceFolder: subfolder,
            driveId,
            parentId: newFolder.id,
            parentPath: folderPath,
        });
    }

    return newFolder;
}
