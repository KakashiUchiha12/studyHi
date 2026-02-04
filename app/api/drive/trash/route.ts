import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import fs from 'fs/promises';

/**
 * GET /api/drive/trash - List trashed items
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const drive = await prisma.drive.findUnique({
      where: { userId: session.user.id },
    });

    if (!drive) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    }

    // Get trashed files
    const files = await prisma.driveFile.findMany({
      where: {
        driveId: drive.id,
        deletedAt: { not: null },
      },
      orderBy: { deletedAt: 'desc' },
    });

    // Get trashed folders
    const folders = await prisma.driveFolder.findMany({
      where: {
        driveId: drive.id,
        deletedAt: { not: null },
      },
      orderBy: { deletedAt: 'desc' },
    });

    return NextResponse.json({
      items: [
        ...files.map((f) => ({
          id: f.id,
          type: 'file',
          name: f.originalName,
          size: f.fileSize.toString(),
          deletedAt: f.deletedAt,
          folderId: f.folderId,
        })),
        ...folders.map((f) => ({
          id: f.id,
          type: 'folder',
          name: f.name,
          deletedAt: f.deletedAt,
          parentId: f.parentId,
        })),
      ],
    });
  } catch (error) {
    console.error('Error listing trash:', error);
    return NextResponse.json({ error: 'Failed to list trash' }, { status: 500 });
  }
}

/**
 * POST /api/drive/trash - Restore item from trash
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, itemType } = body;

    if (!itemId || !itemType || !['file', 'folder'].includes(itemType)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const drive = await prisma.drive.findUnique({
      where: { userId: session.user.id },
    });

    if (!drive) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    }

    if (itemType === 'file') {
      const file = await prisma.driveFile.findFirst({
        where: { id: itemId, driveId: drive.id },
      });

      if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      await prisma.driveFile.update({
        where: { id: itemId },
        data: { deletedAt: null },
      });

      // Log activity
      await prisma.driveActivity.create({
        data: {
          driveId: drive.id,
          userId: session.user.id,
          action: 'restore',
          targetType: 'file',
          targetId: itemId,
          targetName: file.originalName,
        },
      });

      return NextResponse.json({ success: true, item: { type: 'file', name: file.originalName } });
    } else {
      const folder = await prisma.driveFolder.findFirst({
        where: { id: itemId, driveId: drive.id },
      });

      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
      }

      await prisma.driveFolder.update({
        where: { id: itemId },
        data: { deletedAt: null },
      });

      // Log activity
      await prisma.driveActivity.create({
        data: {
          driveId: drive.id,
          userId: session.user.id,
          action: 'restore',
          targetType: 'folder',
          targetId: itemId,
          targetName: folder.name,
        },
      });

      return NextResponse.json({ success: true, item: { type: 'folder', name: folder.name } });
    }
  } catch (error) {
    console.error('Error restoring item:', error);
    return NextResponse.json({ error: 'Failed to restore item' }, { status: 500 });
  }
}

/**
 * DELETE /api/drive/trash - Permanently delete item
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    const itemType = searchParams.get('itemType');

    if (!itemId || !itemType || !['file', 'folder'].includes(itemType)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const drive = await prisma.drive.findUnique({
      where: { userId: session.user.id },
    });

    if (!drive) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    }

    if (itemType === 'file') {
      const file = await prisma.driveFile.findFirst({
        where: { id: itemId, driveId: drive.id },
      });

      if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      // Delete physical file
      try {
        await fs.unlink(file.filePath);
        if (file.thumbnailPath) {
          await fs.unlink(file.thumbnailPath).catch(() => {});
        }
      } catch (err) {
        console.error('Error deleting physical file:', err);
      }

      // Delete from database
      await prisma.driveFile.delete({ where: { id: itemId } });

      // Update storage
      await prisma.drive.update({
        where: { id: drive.id },
        data: {
          storageUsed: {
            decrement: file.fileSize,
          },
        },
      });

      return NextResponse.json({ success: true });
    } else {
      // Delete folder and all contents recursively
      const folder = await prisma.driveFolder.findFirst({
        where: { id: itemId, driveId: drive.id },
      });

      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
      }

      // Helper function to recursively collect all files in folder tree
      async function collectAllFiles(folderId: string): Promise<{
        files: any[];
        totalSize: bigint;
      }> {
        // Get files in this folder
        const files = await prisma.driveFile.findMany({
          where: { folderId },
        });

        let allFiles = [...files];
        let totalSize = files.reduce((sum, f) => sum + f.fileSize, BigInt(0));

        // Get subfolders
        const subfolders = await prisma.driveFolder.findMany({
          where: { parentId: folderId },
        });

        // Recursively collect from each subfolder
        for (const subfolder of subfolders) {
          const subResult = await collectAllFiles(subfolder.id);
          allFiles = [...allFiles, ...subResult.files];
          totalSize += subResult.totalSize;
        }

        return { files: allFiles, totalSize };
      }

      // Collect all files recursively
      const { files: allFiles, totalSize } = await collectAllFiles(itemId);

      // Delete physical files
      for (const file of allFiles) {
        try {
          await fs.unlink(file.filePath);
          if (file.thumbnailPath) {
            await fs.unlink(file.thumbnailPath).catch(() => {});
          }
        } catch (err) {
          console.error('Error deleting file:', file.filePath, err);
        }
      }

      // Delete from database (cascade will handle children and files)
      await prisma.driveFolder.delete({ where: { id: itemId } });

      // Update storage
      await prisma.drive.update({
        where: { id: drive.id },
        data: {
          storageUsed: {
            decrement: totalSize,
          },
        },
      });

      return NextResponse.json({ success: true });
    }
  } catch (error) {
    console.error('Error permanently deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
