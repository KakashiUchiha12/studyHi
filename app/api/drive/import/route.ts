import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { detectDuplicates } from '@/lib/drive/duplicate-detection';

/**
 * POST /api/drive/import - Import files/folders from another user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fromUserId, importType, targetId, skipDuplicates = true } = body;

    if (!fromUserId || !importType || !targetId) {
      return NextResponse.json(
        { error: 'Missing required fields: fromUserId, importType, targetId' },
        { status: 400 }
      );
    }

    if (!['subject', 'file', 'folder'].includes(importType)) {
      return NextResponse.json(
        { error: 'Invalid importType. Must be subject, file, or folder.' },
        { status: 400 }
      );
    }

    // Get requester's drive
    const toDrive = await prisma.drive.findUnique({
      where: { userId: session.user.id },
    });

    if (!toDrive) {
      return NextResponse.json(
        { error: 'Your drive not found' },
        { status: 404 }
      );
    }

    // Get source drive
    const fromDrive = await prisma.drive.findUnique({
      where: { userId: fromUserId },
    });

    if (!fromDrive) {
      return NextResponse.json(
        { error: 'Source drive not found' },
        { status: 404 }
      );
    }

    // Check if source user allows copying
    if (fromDrive.allowCopying === 'DENY') {
      return NextResponse.json(
        { error: 'User does not allow importing from their drive' },
        { status: 403 }
      );
    }

    let importResult: any = {
      imported: [],
      duplicates: [],
      skipped: [],
      totalSize: BigInt(0),
    };

    if (importType === 'file') {
      // Import single file
      const file = await prisma.driveFile.findFirst({
        where: {
          id: targetId,
          driveId: fromDrive.id,
          deletedAt: null,
        },
      });

      if (!file) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }

      // Check if file is public or copying is allowed
      if (!file.isPublic && fromDrive.allowCopying !== 'ALLOW') {
        return NextResponse.json(
          { error: 'File is not public and copying requires approval' },
          { status: 403 }
        );
      }

      // Check for duplicates
      const duplicateCheck = await detectDuplicates(toDrive.id, [
        {
          name: file.originalName,
          hash: file.fileHash,
          size: file.fileSize,
        },
      ]);

      const duplicate = duplicateCheck[0];

      if (duplicate.isDuplicate) {
        if (skipDuplicates) {
          importResult.duplicates.push({
            name: file.originalName,
            type: duplicate.duplicateType,
            existingFileId: duplicate.existingFileId,
          });
          importResult.skipped.push(file.originalName);
        } else {
          // Import with different name
          const copiedFile = await importFile(
            file,
            toDrive.id,
            null,
            session.user.id,
            `${file.originalName} (${Date.now()})`
          );
          importResult.imported.push(copiedFile);
          importResult.totalSize += file.fileSize;
        }
      } else {
        // No duplicate, import normally
        const copiedFile = await importFile(
          file,
          toDrive.id,
          null,
          session.user.id
        );
        importResult.imported.push(copiedFile);
        importResult.totalSize += file.fileSize;
      }
    } else if (importType === 'folder') {
      // Import folder with all files
      const folder = await prisma.driveFolder.findFirst({
        where: {
          id: targetId,
          driveId: fromDrive.id,
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

      // Check if folder is public or copying is allowed
      if (!folder.isPublic && fromDrive.allowCopying !== 'ALLOW') {
        return NextResponse.json(
          { error: 'Folder is not public and copying requires approval' },
          { status: 403 }
        );
      }

      // Check for duplicates
      const filesData = folder.files.map((file) => ({
        name: file.originalName,
        hash: file.fileHash,
        size: file.fileSize,
      }));

      const duplicateChecks = await detectDuplicates(toDrive.id, filesData);

      // Create folder
      const copiedFolder = await prisma.driveFolder.create({
        data: {
          driveId: toDrive.id,
          parentId: null,
          name: folder.name,
          path: `/${folder.name}`,
          isPublic: false,
        },
      });

      // Import files
      for (let i = 0; i < folder.files.length; i++) {
        const file = folder.files[i];
        const duplicate = duplicateChecks[i];

        if (duplicate.isDuplicate) {
          if (skipDuplicates) {
            importResult.duplicates.push({
              name: file.originalName,
              type: duplicate.duplicateType,
              existingFileId: duplicate.existingFileId,
            });
            importResult.skipped.push(file.originalName);
          } else {
            // Import with different name
            const copiedFile = await importFile(
              file,
              toDrive.id,
              copiedFolder.id,
              session.user.id,
              `${file.originalName} (${Date.now()})`
            );
            importResult.imported.push(copiedFile);
            importResult.totalSize += file.fileSize;
          }
        } else {
          // No duplicate, import normally
          const copiedFile = await importFile(
            file,
            toDrive.id,
            copiedFolder.id,
            session.user.id
          );
          importResult.imported.push(copiedFile);
          importResult.totalSize += file.fileSize;
        }
      }

      // Log activity for folder
      await prisma.driveActivity.create({
        data: {
          driveId: toDrive.id,
          userId: session.user.id,
          action: 'import',
          targetType: 'folder',
          targetId: copiedFolder.id,
          targetName: copiedFolder.name,
          metadata: JSON.stringify({
            fromUserId,
            originalFolderId: folder.id,
            fileCount: importResult.imported.length,
            duplicateCount: importResult.duplicates.length,
          }),
        },
      });
    } else if (importType === 'subject') {
      // Import subject folder and all files
      const subject = await prisma.subject.findFirst({
        where: {
          id: targetId,
          userId: fromUserId,
        },
      });

      if (!subject) {
        return NextResponse.json(
          { error: 'Subject not found' },
          { status: 404 }
        );
      }

      // Find subject folder
      const subjectFolder = await prisma.driveFolder.findFirst({
        where: {
          subjectId: targetId,
          driveId: fromDrive.id,
          deletedAt: null,
        },
        include: {
          files: {
            where: { deletedAt: null },
          },
        },
      });

      if (!subjectFolder) {
        return NextResponse.json(
          { error: 'Subject folder not found' },
          { status: 404 }
        );
      }

      // Check if folder is public or copying is allowed
      if (!subjectFolder.isPublic && fromDrive.allowCopying !== 'ALLOW') {
        return NextResponse.json(
          { error: 'Subject is not public and copying requires approval' },
          { status: 403 }
        );
      }

      // Check for duplicates
      const filesData = subjectFolder.files.map((file) => ({
        name: file.originalName,
        hash: file.fileHash,
        size: file.fileSize,
      }));

      const duplicateChecks = await detectDuplicates(toDrive.id, filesData);

      // Create folder (without linking to subject)
      const copiedFolder = await prisma.driveFolder.create({
        data: {
          driveId: toDrive.id,
          parentId: null,
          name: `${subject.name} (Imported)`,
          path: `/${subject.name} (Imported)`,
          isPublic: false,
        },
      });

      // Import files
      for (let i = 0; i < subjectFolder.files.length; i++) {
        const file = subjectFolder.files[i];
        const duplicate = duplicateChecks[i];

        if (duplicate.isDuplicate) {
          if (skipDuplicates) {
            importResult.duplicates.push({
              name: file.originalName,
              type: duplicate.duplicateType,
              existingFileId: duplicate.existingFileId,
            });
            importResult.skipped.push(file.originalName);
          } else {
            const copiedFile = await importFile(
              file,
              toDrive.id,
              copiedFolder.id,
              session.user.id,
              `${file.originalName} (${Date.now()})`
            );
            importResult.imported.push(copiedFile);
            importResult.totalSize += file.fileSize;
          }
        } else {
          const copiedFile = await importFile(
            file,
            toDrive.id,
            copiedFolder.id,
            session.user.id
          );
          importResult.imported.push(copiedFile);
          importResult.totalSize += file.fileSize;
        }
      }

      // Log activity
      await prisma.driveActivity.create({
        data: {
          driveId: toDrive.id,
          userId: session.user.id,
          action: 'import',
          targetType: 'folder',
          targetId: copiedFolder.id,
          targetName: copiedFolder.name,
          metadata: JSON.stringify({
            fromUserId,
            subjectId: subject.id,
            subjectName: subject.name,
            fileCount: importResult.imported.length,
            duplicateCount: importResult.duplicates.length,
          }),
        },
      });
    }

    // Update storage
    if (importResult.totalSize > BigInt(0)) {
      await prisma.drive.update({
        where: { id: toDrive.id },
        data: {
          storageUsed: { increment: importResult.totalSize },
        },
      });
    }

    return NextResponse.json({
      message: 'Import completed',
      result: {
        imported: importResult.imported.length,
        duplicates: importResult.duplicates.length,
        skipped: importResult.skipped.length,
        totalSize: importResult.totalSize.toString(),
        duplicateReport: importResult.duplicates,
        files: importResult.imported,
      },
    });
  } catch (error) {
    console.error('Error importing:', error);
    return NextResponse.json(
      { error: 'Failed to import' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to import a file
 */
async function importFile(
  sourceFile: any,
  targetDriveId: string,
  targetFolderId: string | null,
  userId: string,
  customName?: string
) {
  const copiedFile = await prisma.driveFile.create({
    data: {
      driveId: targetDriveId,
      folderId: targetFolderId,
      originalName: customName || sourceFile.originalName,
      storedName: sourceFile.storedName,
      fileSize: sourceFile.fileSize,
      mimeType: sourceFile.mimeType,
      fileType: sourceFile.fileType,
      fileHash: sourceFile.fileHash,
      filePath: sourceFile.filePath,
      thumbnailPath: sourceFile.thumbnailPath,
      isPublic: false,
      description: sourceFile.description,
      tags: sourceFile.tags,
    },
  });

  // Log activity
  await prisma.driveActivity.create({
    data: {
      driveId: targetDriveId,
      userId,
      action: 'import',
      targetType: 'file',
      targetId: copiedFile.id,
      targetName: copiedFile.originalName,
      metadata: JSON.stringify({
        originalFileId: sourceFile.id,
      }),
    },
  });

  return copiedFile;
}
