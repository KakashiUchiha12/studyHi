import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { copyFile } from 'fs/promises';
import * as path from 'path';

/**
 * PUT /api/drive/copy-request/[id] - Approve or deny a copy request
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'approve' or 'deny'

    if (!['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be approve or deny.' },
        { status: 400 }
      );
    }

    // Get copy request
    const copyRequest = await prisma.copyRequest.findUnique({
      where: { id },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!copyRequest) {
      return NextResponse.json(
        { error: 'Copy request not found' },
        { status: 404 }
      );
    }

    // Only the recipient can approve/deny
    if (copyRequest.toUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to process this request' },
        { status: 403 }
      );
    }

    // Check if already processed
    if (copyRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Request already ${copyRequest.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    if (action === 'deny') {
      // Simply update status to DENIED
      const updatedRequest = await prisma.copyRequest.update({
        where: { id },
        data: { status: 'DENIED' },
      });

      return NextResponse.json({
        message: 'Copy request denied',
        copyRequest: updatedRequest,
      });
    }

    // Handle approval - copy the requested content
    const fromDrive = await prisma.drive.findUnique({
      where: { id: copyRequest.fromDriveId },
    });

    if (!fromDrive) {
      return NextResponse.json(
        { error: 'Source drive not found' },
        { status: 404 }
      );
    }

    let copiedItems = [];

    if (copyRequest.requestType === 'file') {
      // Copy single file
      const file = await prisma.driveFile.findFirst({
        where: {
          id: copyRequest.targetId,
          driveId: copyRequest.toDriveId,
          deletedAt: null,
        },
      });

      if (!file) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }

      // Check storage limit
      const currentStorageUsed = fromDrive.storageUsed + file.fileSize;
      if (currentStorageUsed > fromDrive.storageLimit) {
        return NextResponse.json(
          { error: 'Insufficient storage space' },
          { status: 400 }
        );
      }

      // Create file copy in requester's drive
      const copiedFile = await prisma.driveFile.create({
        data: {
          driveId: fromDrive.id,
          folderId: null, // Copy to root
          originalName: file.originalName,
          storedName: file.storedName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          fileType: file.fileType,
          fileHash: file.fileHash,
          filePath: file.filePath,
          thumbnailPath: file.thumbnailPath,
          isPublic: false, // Always private when copied
          description: file.description,
          tags: file.tags,
        },
      });

      // Update storage
      await prisma.drive.update({
        where: { id: fromDrive.id },
        data: {
          storageUsed: { increment: file.fileSize },
        },
      });

      // Log activity
      await prisma.driveActivity.create({
        data: {
          driveId: fromDrive.id,
          userId: copyRequest.fromUserId,
          action: 'import',
          targetType: 'file',
          targetId: copiedFile.id,
          targetName: copiedFile.originalName,
          metadata: JSON.stringify({
            fromUser: copyRequest.toUser.name,
            originalFileId: file.id,
          }),
        },
      });

      copiedItems.push(copiedFile);
    } else if (copyRequest.requestType === 'folder') {
      // Copy folder with all files
      const folder = await prisma.driveFolder.findFirst({
        where: {
          id: copyRequest.targetId,
          driveId: copyRequest.toDriveId,
          deletedAt: null,
        },
        include: {
          files: {
            where: { deletedAt: null },
          },
        },
      });

      if (!folder) {
        return NextResponse.json(
          { error: 'Folder not found' },
          { status: 404 }
        );
      }

      // Calculate total size
      const totalSize = folder.files.reduce(
        (sum, file) => sum + file.fileSize,
        BigInt(0)
      );

      // Check storage limit
      const currentStorageUsed = fromDrive.storageUsed + totalSize;
      if (currentStorageUsed > fromDrive.storageLimit) {
        return NextResponse.json(
          { error: 'Insufficient storage space' },
          { status: 400 }
        );
      }

      // Create folder in requester's drive
      const copiedFolder = await prisma.driveFolder.create({
        data: {
          driveId: fromDrive.id,
          parentId: null,
          name: folder.name,
          path: `/${folder.name}`,
          isPublic: false,
        },
      });

      // Copy all files
      for (const file of folder.files) {
        const copiedFile = await prisma.driveFile.create({
          data: {
            driveId: fromDrive.id,
            folderId: copiedFolder.id,
            originalName: file.originalName,
            storedName: file.storedName,
            fileSize: file.fileSize,
            mimeType: file.mimeType,
            fileType: file.fileType,
            fileHash: file.fileHash,
            filePath: file.filePath,
            thumbnailPath: file.thumbnailPath,
            isPublic: false,
            description: file.description,
            tags: file.tags,
          },
        });

        copiedItems.push(copiedFile);
      }

      // Update storage
      await prisma.drive.update({
        where: { id: fromDrive.id },
        data: {
          storageUsed: { increment: totalSize },
        },
      });

      // Log activity
      await prisma.driveActivity.create({
        data: {
          driveId: fromDrive.id,
          userId: copyRequest.fromUserId,
          action: 'import',
          targetType: 'folder',
          targetId: copiedFolder.id,
          targetName: copiedFolder.name,
          metadata: JSON.stringify({
            fromUser: copyRequest.toUser.name,
            originalFolderId: folder.id,
            fileCount: folder.files.length,
          }),
        },
      });
    }

    // Update request status
    const updatedRequest = await prisma.copyRequest.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    return NextResponse.json({
      message: 'Copy request approved and content copied',
      copyRequest: updatedRequest,
      copiedItems,
    });
  } catch (error) {
    console.error('Error processing copy request:', error);
    return NextResponse.json(
      { error: 'Failed to process copy request' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/drive/copy-request/[id] - Cancel a copy request
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get copy request
    const copyRequest = await prisma.copyRequest.findUnique({
      where: { id },
    });

    if (!copyRequest) {
      return NextResponse.json(
        { error: 'Copy request not found' },
        { status: 404 }
      );
    }

    // Only the requester can cancel
    if (copyRequest.fromUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to cancel this request' },
        { status: 403 }
      );
    }

    // Can only cancel pending requests
    if (copyRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Cannot cancel a ${copyRequest.status.toLowerCase()} request` },
        { status: 400 }
      );
    }

    // Delete the request
    await prisma.copyRequest.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Copy request cancelled',
    });
  } catch (error) {
    console.error('Error cancelling copy request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel copy request' },
      { status: 500 }
    );
  }
}
