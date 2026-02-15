import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';
import { trackBandwidth } from '@/lib/drive/bandwidth';

/**
 * GET /api/drive/files/[id]
 * Download a file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    const { id: fileId } = await params;

    // Get file from database
    const file = await prisma.driveFile.findUnique({
      where: { id: fileId },
      include: {
        drive: {
          select: {
            userId: true,
            isPrivate: true,
          },
        },
      },
    });

    if (!file || file.deletedAt) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check permissions
    const isOwner = user?.id === file.drive.userId;
    const canAccess = isOwner || file.isPublic || !file.drive.isPrivate;

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If not the owner, track bandwidth for the owner
    if (!isOwner && user?.id) {
      const bandwidthCheck = await trackBandwidth(
        file.drive.userId,
        Number(file.fileSize)
      );

      if (!bandwidthCheck.allowed) {
        return NextResponse.json(
          {
            error: bandwidthCheck.error,
            resetTime: bandwidthCheck.resetTime,
          },
          { status: 429 }
        );
      }
    }

    // Read file from disk
    const filePath = path.isAbsolute(file.filePath) ? file.filePath : path.join(process.cwd(), 'public', file.filePath);
    const fileBuffer = await readFile(filePath);

    // Update counts
    await prisma.driveFile.update({
      where: { id: fileId },
      data: {
        downloadCount: file.downloadCount + 1,
        viewCount: { increment: 1 }
      },
    });

    // Create activity log
    await prisma.driveActivity.create({
      data: {
        driveId: file.driveId,
        userId: user?.id || file.drive.userId,
        action: 'download',
        targetType: 'file',
        targetId: file.id,
        targetName: file.originalName,
        metadata: JSON.stringify({
          fileSize: file.fileSize.toString(),
          isOwner,
        }),
      },
    });

    // Return file with appropriate headers
    const inline = request.nextUrl.searchParams.get('inline') === 'true';
    const thumbnail = request.nextUrl.searchParams.get('thumbnail') === 'true';

    if (thumbnail) {
      let thumbBuffer: Buffer | null = null;
      let thumbMimeType = 'image/webp';

      // Only use existing thumbnail if it's the high-quality version (hq)
      if (file.thumbnailPath && file.thumbnailPath.includes('_hq.webp')) {
        try {
          const thumbPath = path.isAbsolute(file.thumbnailPath) ? file.thumbnailPath : path.join(process.cwd(), 'public', file.thumbnailPath);
          thumbBuffer = await readFile(thumbPath);
        } catch (error) {
          console.error('Failed to read existing thumbnail:', error);
        }
      }

      // Generate if not found or if it was the old low-quality version
      if (!thumbBuffer) {
        const { ThumbnailService } = await import('@/lib/drive/thumbnail-service');
        const originalFilePath = path.isAbsolute(file.filePath) ? file.filePath : path.join(process.cwd(), 'public', file.filePath);
        const originalBuffer = await readFile(originalFilePath);

        // Use high-quality defaults (1200px wide, high density for PDF)
        thumbBuffer = await ThumbnailService.generateThumbnail(originalBuffer, file.mimeType);

        if (thumbBuffer) {
          try {
            const thumbRelDir = await ThumbnailService.ensureThumbnailDir(file.drive.userId);
            const thumbName = `${file.id}_hq.webp`; // New suffix to distinguish from old low-quality version
            const thumbPath = path.join(thumbRelDir, thumbName).replace(/\\/g, '/');

            await writeFile(path.join(process.cwd(), 'public', thumbPath), thumbBuffer);

            // Save new path to DB
            await prisma.driveFile.update({
              where: { id: file.id },
              data: { thumbnailPath: thumbPath }
            });
          } catch (error) {
            console.error('Failed to save generated thumbnail:', error);
          }
        }
      }

      if (thumbBuffer) {
        return new NextResponse(thumbBuffer as any, {
          headers: {
            'Content-Type': thumbMimeType,
            'Content-Disposition': 'inline',
            'Cache-Control': 'public, max-age=31536000, immutable',
          },
        });
      }

      // If it's an image, we can try to return the original inline
      if (file.mimeType.startsWith('image/')) {
        return new NextResponse(fileBuffer as any, {
          headers: {
            'Content-Type': file.mimeType,
            'Content-Disposition': 'inline',
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }

      // Final fallback for thumbnails - don't trigger download by returning a transparent pixel
      const TRANSPARENT_PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      return new NextResponse(TRANSPARENT_PIXEL as any, {
        headers: {
          'Content-Type': 'image/gif',
          'Content-Disposition': 'inline',
          'Cache-Control': 'no-cache',
        },
        status: 200, // Return 200 with fallback to avoid browser error behaviors
      });
    }

    // Return file with appropriate headers
    return new NextResponse(fileBuffer as any, {
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': inline
          ? 'inline'
          : `attachment; filename="${encodeURIComponent(file.originalName)}"`,
        'Content-Length': file.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/drive/files/[id]
 * Update file metadata
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: fileId } = await params;
    const body = await request.json();
    const { originalName, description, tags, isPublic } = body;

    // Get file and verify ownership
    const file = await prisma.driveFile.findUnique({
      where: { id: fileId },
      include: {
        drive: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!file || file.deletedAt) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (file.drive.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    if (originalName !== undefined) updateData.originalName = originalName;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    // Update file
    const updatedFile = await prisma.driveFile.update({
      where: { id: fileId },
      data: updateData,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.driveActivity.create({
      data: {
        driveId: file.driveId,
        userId: user.id,
        action: 'rename',
        targetType: 'file',
        targetId: file.id,
        targetName: updatedFile.originalName,
        metadata: JSON.stringify({
          oldName: file.originalName,
          newName: updatedFile.originalName,
          changes: Object.keys(updateData),
        }),
      },
    });

    return NextResponse.json({
      file: {
        ...updatedFile,
        fileSize: updatedFile.fileSize.toString(),
        tags: JSON.parse(updatedFile.tags),
      },
    });
  } catch (error) {
    console.error('Error updating file:', error);
    return NextResponse.json(
      { error: 'Failed to update file' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/drive/files/[id]
 * Soft delete file (move to trash)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: fileId } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get('permanent') === 'true';

    // Get file and verify ownership
    const file = await prisma.driveFile.findUnique({
      where: { id: fileId },
      include: {
        drive: {
          select: {
            userId: true,
            storageUsed: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (file.drive.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (permanent) {
      // Permanently delete file
      const filePath = path.isAbsolute(file.filePath) ? file.filePath : path.join(process.cwd(), 'public', file.filePath);

      try {
        await unlink(filePath);
      } catch (error) {
        console.error('Error deleting file from disk:', error);
      }

      // Delete from database
      await prisma.driveFile.delete({
        where: { id: fileId },
      });

      // Update storage usage
      await prisma.drive.update({
        where: { id: file.driveId },
        data: {
          storageUsed: file.drive.storageUsed - file.fileSize,
        },
      });

      // Create activity log
      await prisma.driveActivity.create({
        data: {
          driveId: file.driveId,
          userId: user.id,
          action: 'delete',
          targetType: 'file',
          targetId: file.id,
          targetName: file.originalName,
          metadata: JSON.stringify({
            fileSize: file.fileSize.toString(),
            permanent: true,
          }),
        },
      });

      return NextResponse.json({ message: 'File permanently deleted' });
    } else {
      // Soft delete (move to trash)
      const updatedFile = await prisma.driveFile.update({
        where: { id: fileId },
        data: {
          deletedAt: new Date(),
        },
      });

      // Create activity log
      await prisma.driveActivity.create({
        data: {
          driveId: file.driveId,
          userId: user.id,
          action: 'delete',
          targetType: 'file',
          targetId: file.id,
          targetName: file.originalName,
          metadata: JSON.stringify({
            fileSize: file.fileSize.toString(),
            permanent: false,
          }),
        },
      });

      return NextResponse.json({
        message: 'File moved to trash',
        file: {
          ...updatedFile,
          fileSize: updatedFile.fileSize.toString(),
        },
      });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
