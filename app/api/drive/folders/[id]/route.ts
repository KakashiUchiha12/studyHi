import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { unlink } from 'fs/promises';
import path from 'path';

/**
 * GET /api/drive/folders/[id]
 * Get folder details and breadcrumbs
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: folderId } = await params;

    // Get folder and verify ownership
    const folder = await prisma.driveFolder.findUnique({
      where: { id: folderId },
      include: {
        drive: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!folder || folder.deletedAt) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (folder.drive.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Build breadcrumbs
    const breadcrumbs = [];
    let current = await prisma.driveFolder.findUnique({
      where: { id: folderId },
      include: { parent: true },
    });

    while (current) {
      breadcrumbs.unshift({ id: current.id, name: current.name });
      if (current.parentId) {
        current = await prisma.driveFolder.findUnique({
          where: { id: current.parentId },
          include: { parent: true },
        });
      } else {
        current = null;
      }
    }

    return NextResponse.json({ folder, breadcrumbs });
  } catch (error) {
    console.error('Error getting folder:', error);
    return NextResponse.json(
      { error: 'Failed to get folder' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/drive/folders/[id]
 * Update folder metadata
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: folderId } = await params;
    const body = await request.json();
    const { name, isPublic } = body;

    // Get folder and verify ownership
    const folder = await prisma.driveFolder.findUnique({
      where: { id: folderId },
      include: {
        drive: {
          select: {
            userId: true,
          },
        },
        parent: {
          select: {
            path: true,
          },
        },
        children: {
          where: { deletedAt: null },
        },
      },
    });

    if (!folder || folder.deletedAt) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (folder.drive.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    const oldName = folder.name;
    const oldPath = folder.path;

    if (name !== undefined && name !== oldName) {
      // Check if folder with same name already exists in parent
      const existingFolder = await prisma.driveFolder.findFirst({
        where: {
          driveId: folder.driveId,
          parentId: folder.parentId,
          name,
          deletedAt: null,
          id: { not: folderId },
        },
      });

      if (existingFolder) {
        return NextResponse.json(
          { error: 'Folder with this name already exists' },
          { status: 409 }
        );
      }

      // Update path
      const newPath = folder.parent
        ? `${folder.parent.path}/${name}`
        : name;

      updateData.name = name;
      updateData.path = newPath;

      // Update all children paths
      if (folder.children.length > 0) {
        await updateChildrenPaths(folderId, oldPath, newPath);
      }
    }

    if (isPublic !== undefined) {
      updateData.isPublic = isPublic;
    }

    // Update folder
    const updatedFolder = await prisma.driveFolder.update({
      where: { id: folderId },
      data: updateData,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.driveActivity.create({
      data: {
        driveId: folder.driveId,
        userId,
        action: 'rename',
        targetType: 'folder',
        targetId: folderId,
        targetName: updatedFolder.name,
        metadata: JSON.stringify({
          oldName,
          newName: updatedFolder.name,
          oldPath,
          newPath: updatedFolder.path,
        }),
      },
    });

    return NextResponse.json({ folder: updatedFolder });
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/drive/folders/[id]
 * Soft delete folder (move to trash with all contents)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: folderId } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    // Get folder and verify ownership
    const folder = await prisma.driveFolder.findUnique({
      where: { id: folderId },
      include: {
        drive: {
          select: {
            userId: true,
            storageUsed: true,
          },
        },
      },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (folder.drive.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (permanent) {
      // Get all files in folder and subfolders for storage calculation
      const allFiles = await getAllFilesInFolder(folderId);
      let totalSize = BigInt(0);

      // Permanently delete all files
      for (const file of allFiles) {
        totalSize += file.fileSize;
        const filePath = path.join(process.cwd(), file.filePath);

        try {
          await unlink(filePath);
        } catch (error) {
          console.error('Error deleting file from disk:', error);
        }
      }

      // Delete folder (cascade will delete all children and files)
      await prisma.driveFolder.delete({
        where: { id: folderId },
      });

      // Update storage usage
      if (totalSize > BigInt(0)) {
        await prisma.drive.update({
          where: { id: folder.driveId },
          data: {
            storageUsed: folder.drive.storageUsed - totalSize,
          },
        });
      }

      // Create activity log
      await prisma.driveActivity.create({
        data: {
          driveId: folder.driveId,
          userId,
          action: 'delete',
          targetType: 'folder',
          targetId: folderId,
          targetName: folder.name,
          metadata: JSON.stringify({
            permanent: true,
            filesDeleted: allFiles.length,
            storageFreed: totalSize.toString(),
          }),
        },
      });

      return NextResponse.json({
        message: 'Folder permanently deleted',
        filesDeleted: allFiles.length,
        storageFreed: totalSize.toString(),
      });
    } else {
      // Soft delete folder and all contents
      const now = new Date();

      // Get all subfolders
      const allSubfolders = await getAllSubfolders(folderId);
      const folderIds = [folderId, ...allSubfolders.map(f => f.id)];

      // Soft delete all folders
      await prisma.driveFolder.updateMany({
        where: {
          id: { in: folderIds },
        },
        data: {
          deletedAt: now,
        },
      });

      // Soft delete all files in these folders
      await prisma.driveFile.updateMany({
        where: {
          folderId: { in: folderIds },
        },
        data: {
          deletedAt: now,
        },
      });

      // Create activity log
      await prisma.driveActivity.create({
        data: {
          driveId: folder.driveId,
          userId,
          action: 'delete',
          targetType: 'folder',
          targetId: folderId,
          targetName: folder.name,
          metadata: JSON.stringify({
            permanent: false,
            subfoldersAffected: folderIds.length - 1,
          }),
        },
      });

      return NextResponse.json({
        message: 'Folder moved to trash',
        subfoldersAffected: folderIds.length - 1,
      });
    }
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to update all children paths recursively
 */
async function updateChildrenPaths(
  folderId: string,
  oldPath: string,
  newPath: string
): Promise<void> {
  const children = await prisma.driveFolder.findMany({
    where: {
      parentId: folderId,
      deletedAt: null,
    },
  });

  for (const child of children) {
    const updatedChildPath = child.path.replace(oldPath, newPath);

    await prisma.driveFolder.update({
      where: { id: child.id },
      data: { path: updatedChildPath },
    });

    // Recursively update grandchildren
    await updateChildrenPaths(child.id, child.path, updatedChildPath);
  }
}

/**
 * Helper function to get all files in folder and subfolders
 */
async function getAllFilesInFolder(folderId: string) {
  const subfolders = await getAllSubfolders(folderId);
  const folderIds = [folderId, ...subfolders.map(f => f.id)];

  return await prisma.driveFile.findMany({
    where: {
      folderId: { in: folderIds },
    },
    select: {
      id: true,
      filePath: true,
      fileSize: true,
    },
  });
}

/**
 * Helper function to get all subfolders recursively
 */
async function getAllSubfolders(folderId: string): Promise<any[]> {
  const directChildren = await prisma.driveFolder.findMany({
    where: {
      parentId: folderId,
    },
  });

  const allSubfolders = [...directChildren];

  for (const child of directChildren) {
    const grandChildren = await getAllSubfolders(child.id);
    allSubfolders.push(...grandChildren);
  }

  return allSubfolders;
}

/**
 * Helper function to update all children paths recursively
 */
async function updateChildrenPaths(
  folderId: string,
  oldPath: string,
  newPath: string
): Promise<void> {
  const children = await prisma.driveFolder.findMany({
    where: {
      parentId: folderId,
      deletedAt: null,
    },
  });

  for (const child of children) {
    const updatedChildPath = child.path.replace(oldPath, newPath);

    await prisma.driveFolder.update({
      where: { id: child.id },
      data: { path: updatedChildPath },
    });

    // Recursively update grandchildren
    await updateChildrenPaths(child.id, child.path, updatedChildPath);
  }
}

/**
 * Helper function to get all files in folder and subfolders
 */
async function getAllFilesInFolder(folderId: string) {
  const subfolders = await getAllSubfolders(folderId);
  const folderIds = [folderId, ...subfolders.map(f => f.id)];

  return await prisma.driveFile.findMany({
    where: {
      folderId: { in: folderIds },
    },
    select: {
      id: true,
      filePath: true,
      fileSize: true,
    },
  });
}

/**
 * Helper function to get all subfolders recursively
 */
async function getAllSubfolders(folderId: string): Promise<any[]> {
  const directChildren = await prisma.driveFolder.findMany({
    where: {
      parentId: folderId,
    },
  });

  const allSubfolders = [...directChildren];

  for (const child of directChildren) {
    const grandChildren = await getAllSubfolders(child.id);
    allSubfolders.push(...grandChildren);
  }

  return allSubfolders;
}
