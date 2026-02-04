import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';

/**
 * POST /api/drive/bulk - Handle bulk operations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { operation, itemIds, itemType, targetFolderId } = body;

    if (!operation || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Operation and itemIds are required.' },
        { status: 400 }
      );
    }

    if (!['delete', 'move', 'copy', 'restore'].includes(operation)) {
      return NextResponse.json(
        { error: 'Invalid operation. Must be delete, move, copy, or restore.' },
        { status: 400 }
      );
    }

    if (!['file', 'folder'].includes(itemType)) {
      return NextResponse.json(
        { error: 'Invalid itemType. Must be file or folder.' },
        { status: 400 }
      );
    }

    // Get user's drive
    const drive = await prisma.drive.findUnique({
      where: { userId: session.user.id },
    });

    if (!drive) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    }

    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    // Process each item
    for (const itemId of itemIds) {
      try {
        if (itemType === 'file') {
          await handleFileBulkOperation(
            operation,
            itemId,
            drive.id,
            targetFolderId,
            session.user.id
          );
        } else {
          await handleFolderBulkOperation(
            operation,
            itemId,
            drive.id,
            targetFolderId,
            session.user.id
          );
        }
        results.success.push(itemId);
      } catch (error: any) {
        results.failed.push({
          id: itemId,
          error: error.message || 'Operation failed',
        });
      }
    }

    return NextResponse.json({
      message: `Bulk ${operation} completed`,
      results,
    });
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk operation' },
      { status: 500 }
    );
  }
}

async function handleFileBulkOperation(
  operation: string,
  fileId: string,
  driveId: string,
  targetFolderId: string | null,
  userId: string
) {
  const file = await prisma.driveFile.findFirst({
    where: { id: fileId, driveId },
  });

  if (!file) {
    throw new Error('File not found');
  }

  switch (operation) {
    case 'delete':
      // Soft delete
      await prisma.driveFile.update({
        where: { id: fileId },
        data: { deletedAt: new Date() },
      });

      await prisma.driveActivity.create({
        data: {
          driveId,
          userId,
          action: 'delete',
          targetType: 'file',
          targetId: fileId,
          targetName: file.originalName,
          metadata: JSON.stringify({ bulk: true }),
        },
      });
      break;

    case 'move':
      if (!targetFolderId) {
        throw new Error('Target folder ID required for move operation');
      }

      // Verify target folder exists
      const targetFolder = await prisma.driveFolder.findFirst({
        where: { id: targetFolderId, driveId, deletedAt: null },
      });

      if (!targetFolder) {
        throw new Error('Target folder not found');
      }

      await prisma.driveFile.update({
        where: { id: fileId },
        data: { folderId: targetFolderId },
      });

      await prisma.driveActivity.create({
        data: {
          driveId,
          userId,
          action: 'move',
          targetType: 'file',
          targetId: fileId,
          targetName: file.originalName,
          metadata: JSON.stringify({ 
            bulk: true,
            targetFolderId,
            targetFolderName: targetFolder.name 
          }),
        },
      });
      break;

    case 'copy':
      if (!targetFolderId) {
        throw new Error('Target folder ID required for copy operation');
      }

      const copyTargetFolder = await prisma.driveFolder.findFirst({
        where: { id: targetFolderId, driveId, deletedAt: null },
      });

      if (!copyTargetFolder) {
        throw new Error('Target folder not found');
      }

      // Create a copy of the file
      const copiedFile = await prisma.driveFile.create({
        data: {
          driveId,
          folderId: targetFolderId,
          originalName: `${file.originalName} (Copy)`,
          storedName: file.storedName,
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

      // Update storage usage
      await prisma.drive.update({
        where: { id: driveId },
        data: {
          storageUsed: { increment: file.fileSize },
        },
      });

      await prisma.driveActivity.create({
        data: {
          driveId,
          userId,
          action: 'copy',
          targetType: 'file',
          targetId: copiedFile.id,
          targetName: copiedFile.originalName,
          metadata: JSON.stringify({ 
            bulk: true,
            originalFileId: fileId,
            targetFolderId 
          }),
        },
      });
      break;

    case 'restore':
      // Restore from trash
      if (!file.deletedAt) {
        throw new Error('File is not in trash');
      }

      await prisma.driveFile.update({
        where: { id: fileId },
        data: { deletedAt: null },
      });

      await prisma.driveActivity.create({
        data: {
          driveId,
          userId,
          action: 'restore',
          targetType: 'file',
          targetId: fileId,
          targetName: file.originalName,
          metadata: JSON.stringify({ bulk: true }),
        },
      });
      break;

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}

async function handleFolderBulkOperation(
  operation: string,
  folderId: string,
  driveId: string,
  targetFolderId: string | null,
  userId: string
) {
  const folder = await prisma.driveFolder.findFirst({
    where: { id: folderId, driveId },
  });

  if (!folder) {
    throw new Error('Folder not found');
  }

  switch (operation) {
    case 'delete':
      // Soft delete folder and all contents
      await prisma.driveFolder.update({
        where: { id: folderId },
        data: { deletedAt: new Date() },
      });

      // Also delete all files in folder
      await prisma.driveFile.updateMany({
        where: { folderId, deletedAt: null },
        data: { deletedAt: new Date() },
      });

      await prisma.driveActivity.create({
        data: {
          driveId,
          userId,
          action: 'delete',
          targetType: 'folder',
          targetId: folderId,
          targetName: folder.name,
          metadata: JSON.stringify({ bulk: true }),
        },
      });
      break;

    case 'move':
      if (!targetFolderId) {
        throw new Error('Target folder ID required for move operation');
      }

      // Verify target folder exists and is not a descendant
      const targetFolder = await prisma.driveFolder.findFirst({
        where: { id: targetFolderId, driveId, deletedAt: null },
      });

      if (!targetFolder) {
        throw new Error('Target folder not found');
      }

      // Prevent moving into itself or its descendants
      if (targetFolder.path.startsWith(folder.path)) {
        throw new Error('Cannot move folder into itself or its descendants');
      }

      await prisma.driveFolder.update({
        where: { id: folderId },
        data: { parentId: targetFolderId },
      });

      await prisma.driveActivity.create({
        data: {
          driveId,
          userId,
          action: 'move',
          targetType: 'folder',
          targetId: folderId,
          targetName: folder.name,
          metadata: JSON.stringify({ 
            bulk: true,
            targetFolderId,
            targetFolderName: targetFolder.name 
          }),
        },
      });
      break;

    case 'restore':
      // Restore from trash
      if (!folder.deletedAt) {
        throw new Error('Folder is not in trash');
      }

      await prisma.driveFolder.update({
        where: { id: folderId },
        data: { deletedAt: null },
      });

      // Also restore all files in folder
      await prisma.driveFile.updateMany({
        where: { folderId },
        data: { deletedAt: null },
      });

      await prisma.driveActivity.create({
        data: {
          driveId,
          userId,
          action: 'restore',
          targetType: 'folder',
          targetId: folderId,
          targetName: folder.name,
          metadata: JSON.stringify({ bulk: true }),
        },
      });
      break;

    case 'copy':
      throw new Error('Bulk copy operation for folders is not supported');

    default:
      throw new Error(`Unknown operation: ${operation}`);
  }
}
