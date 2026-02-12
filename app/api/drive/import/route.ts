import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { detectDuplicates } from '@/lib/drive/duplicate-detection';
import path from 'path';
import { copyFile, constants } from 'fs/promises';

/**
 * POST /api/drive/import - Import files/folders from another user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await request.json();
    const importType = body.importType || body.targetType;
    const fromUserId = body.fromUserId;
    const targetId = body.targetId || body.subjectId;
    const skipDuplicates = body.skipDuplicates ?? true;

    if (!fromUserId || !importType || !targetId) {
      return NextResponse.json(
        { error: 'Missing required fields: fromUserId, importType/targetType, targetId/subjectId' },
        { status: 400 }
      );
    }

    const type = importType.toLowerCase();
    if (!['subject', 'file', 'folder'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid import type. Must be subject, file, or folder.' },
        { status: 400 }
      );
    }

    // Get requester's drive
    const toDrive = await prisma.drive.findUnique({
      where: { userId: userId },
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

    if (type === 'file') {
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
            userId,
            `${file.originalName} (Copy)`
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
          userId
        );
        importResult.imported.push(copiedFile);
        importResult.totalSize += file.fileSize;
      }
    } else if (type === 'folder') {
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
              userId,
              `${file.originalName} (Copy)`
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
            userId
          );
          importResult.imported.push(copiedFile);
          importResult.totalSize += file.fileSize;
        }
      }

      // Log activity for folder
      await prisma.driveActivity.create({
        data: {
          driveId: toDrive.id,
          userId: userId,
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
    } else if (type === 'subject') {
      const actualTargetId = targetId;
      const fileIds = body.fileIds || []; // Files selected in UI

      // Import subject and its hierarchy
      const sourceSubject = await prisma.subject.findUnique({
        where: { id: actualTargetId },
        include: {
          chapters: {
            include: {
              materials: true
            }
          },
          files: true
        }
      });

      if (!sourceSubject) {
        return NextResponse.json({ error: 'Source subject not found' }, { status: 404 });
      }

      // 1. Ensure Destination Subject exists (or use existing one)
      let destSubject = await prisma.subject.findFirst({
        where: { userId: userId, name: sourceSubject.name }
      });

      if (!destSubject) {
        destSubject = await prisma.subject.create({
          data: {
            id: `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId: userId,
            name: sourceSubject.name,
            color: sourceSubject.color,
            description: sourceSubject.description,
            code: sourceSubject.code,
            credits: sourceSubject.credits,
            instructor: sourceSubject.instructor,
          }
        });
      }

      // 2. Ensure Drive Folder exists for the destination subject
      let destFolder = await prisma.driveFolder.findFirst({
        where: { driveId: toDrive.id, subjectId: destSubject.id, deletedAt: null }
      });

      if (!destFolder) {
        const folderName = `Subjects - ${destSubject.name}`;
        destFolder = await prisma.driveFolder.create({
          data: {
            driveId: toDrive.id,
            name: folderName,
            path: `/${folderName}`,
            subjectId: destSubject.id,
          }
        });
      }

      // 3. Import SubjectFiles (standalone files)
      for (const sFile of sourceSubject.files) {
        // If fileIds is specified, only import if matched
        if (fileIds.length > 0 && !fileIds.includes(sFile.id)) continue;

        // Check if a file with this storedName already exists in THIS user's drive
        const existingInDrive = await prisma.driveFile.findFirst({
          where: {
            driveId: toDrive.id,
            OR: [
              { storedName: sFile.fileName },
              { originalName: sFile.originalName, folderId: destFolder.id }
            ]
          }
        });

        if (existingInDrive) {
          importResult.duplicates.push({
            name: sFile.originalName,
            type: 'file',
            reason: 'File already exists in your subject folder'
          });
          importResult.skipped.push(sFile.originalName);
        } else {
          try {
            const copiedFile = await importFile(sFile, toDrive.id, destFolder.id, userId);

            // ALSO create SubjectFile so it shows in Subjects tab
            await prisma.subjectFile.create({
              data: {
                userId,
                subjectId: destSubject.id,
                originalName: copiedFile.originalName,
                fileName: copiedFile.storedName,
                fileType: copiedFile.fileType,
                mimeType: copiedFile.mimeType,
                fileSize: Number(copiedFile.fileSize),
                filePath: copiedFile.filePath,
                thumbnailPath: copiedFile.thumbnailPath,
                category: (sFile as any).category || 'OTHER',
                isPublic: false,
              }
            });

            importResult.imported.push(copiedFile);
            importResult.totalSize += BigInt(sFile.fileSize);
          } catch (err) {
            console.error(`Failed to import standalone file ${sFile.originalName}:`, err);
            importResult.skipped.push(sFile.originalName);
          }
        }
      }

      // 4. Chapter Materials (Recursive Copy: Chapters -> Materials -> Files/Links)
      for (const sourceChapter of sourceSubject.chapters) {
        // Find or create chapter
        const destChapter = await prisma.chapter.upsert({
          where: {
            subjectId_order: {
              subjectId: destSubject.id,
              order: sourceChapter.order
            }
          },
          update: { title: sourceChapter.title, description: sourceChapter.description },
          create: {
            subjectId: destSubject.id,
            title: sourceChapter.title,
            description: sourceChapter.description,
            order: sourceChapter.order,
            isCompleted: false
          }
        });

        const chapterFolder = await ensureImportFolderExists(toDrive.id, destFolder.id, sourceChapter.title);

        for (const sourceMaterial of sourceChapter.materials) {
          let materialContent: { files: any[], links: any[] } = { files: [], links: [] };
          let hasContent = false;

          const materialFolder = await ensureImportFolderExists(toDrive.id, chapterFolder.id, sourceMaterial.title);

          if (sourceMaterial.content) {
            try {
              const parsed = JSON.parse(sourceMaterial.content);
              const originalFiles = parsed.files || [];
              const originalLinks = parsed.links || [];

              materialContent.links = originalLinks;
              if (originalLinks.length > 0) hasContent = true;

              for (const f of originalFiles) {
                if (fileIds.length > 0 && !fileIds.includes(f.id)) continue;

                // Check for duplicate in this material folder
                const existingFile = await prisma.driveFile.findFirst({
                  where: {
                    driveId: toDrive.id,
                    folderId: materialFolder.id,
                    originalName: f.name
                  }
                });

                if (existingFile) {
                  materialContent.files.push({
                    id: existingFile.id,
                    name: existingFile.originalName,
                    url: `/api/drive/files/${existingFile.id}`,
                    size: Number(existingFile.fileSize),
                    type: existingFile.mimeType,
                    uploadedAt: new Date().toISOString()
                  } as any);
                  importResult.duplicates.push({ name: f.name, type: 'material_file', reason: 'File already exists in material' });
                  hasContent = true;
                  continue;
                }

                const srcFile = await prisma.driveFile.findUnique({ where: { id: f.id } })
                  || await prisma.subjectFile.findUnique({ where: { id: f.id } });

                if (srcFile) {
                  try {
                    const copied = await importFile(srcFile, toDrive.id, materialFolder.id, userId);
                    materialContent.files.push({
                      id: copied.id,
                      name: copied.originalName,
                      url: `/api/drive/files/${copied.id}`,
                      size: Number(copied.fileSize),
                      type: copied.mimeType,
                      uploadedAt: new Date().toISOString()
                    } as any);
                    importResult.imported.push(copied);
                    importResult.totalSize += BigInt(srcFile.fileSize);
                    hasContent = true;
                  } catch (err) {
                    console.error(`Failed to copy material file ${f.name}:`, err);
                  }
                }
              }
            } catch (e) {
              console.error("Error parsing material content during import", e);
            }
          }

          // Create/Update Material
          const existingMaterial = await prisma.material.findFirst({
            where: {
              chapterId: destChapter.id,
              order: sourceMaterial.order
            }
          });

          if (existingMaterial) {
            await prisma.material.update({
              where: { id: existingMaterial.id },
              data: {
                title: sourceMaterial.title,
                type: sourceMaterial.type,
                content: hasContent ? JSON.stringify(materialContent) : sourceMaterial.content,
              }
            });
          } else {
            await prisma.material.create({
              data: {
                chapterId: destChapter.id,
                subjectId: destSubject.id,
                title: sourceMaterial.title,
                type: sourceMaterial.type,
                content: hasContent ? JSON.stringify(materialContent) : sourceMaterial.content,
                order: sourceMaterial.order,
                isCompleted: false
              }
            });
          }
        }
      }

      // 5. Subject-level Materials (materials with chapterId: null)
      const subjectLevelMaterials = await prisma.material.findMany({
        where: {
          subjectId: sourceSubject.id,
          chapterId: null
        }
      });

      for (const sourceMaterial of subjectLevelMaterials) {
        let materialContent: { files: any[], links: any[] } = { files: [], links: [] };
        let hasContent = false;

        const materialFolder = await ensureImportFolderExists(toDrive.id, destFolder.id, sourceMaterial.title);

        if (sourceMaterial.content) {
          try {
            const parsed = JSON.parse(sourceMaterial.content);
            const originalFiles = parsed.files || [];
            const originalLinks = parsed.links || [];

            materialContent.links = originalLinks;
            if (originalLinks.length > 0) hasContent = true;

            for (const f of originalFiles) {
              if (fileIds.length > 0 && !fileIds.includes(f.id)) continue;

              const existingFile = await prisma.driveFile.findFirst({
                where: {
                  driveId: toDrive.id,
                  folderId: materialFolder.id,
                  originalName: f.name
                }
              });

              if (existingFile) {
                materialContent.files.push({
                  id: existingFile.id,
                  name: existingFile.originalName,
                  url: `/api/drive/files/${existingFile.id}`,
                  size: Number(existingFile.fileSize),
                  type: existingFile.mimeType,
                  uploadedAt: new Date().toISOString()
                } as any);
                hasContent = true;
                continue;
              }

              const srcFile = await prisma.driveFile.findUnique({ where: { id: f.id } })
                || await prisma.subjectFile.findUnique({ where: { id: f.id } });

              if (srcFile) {
                try {
                  const copied = await importFile(srcFile, toDrive.id, materialFolder.id, userId);
                  materialContent.files.push({
                    id: copied.id,
                    name: copied.originalName,
                    url: `/api/drive/files/${copied.id}`,
                    size: Number(copied.fileSize),
                    type: copied.mimeType,
                    uploadedAt: new Date().toISOString()
                  } as any);
                  importResult.imported.push(copied);
                  importResult.totalSize += BigInt(srcFile.fileSize);
                  hasContent = true;
                } catch (err) {
                  console.error(`Failed to copy subject-level material file ${f.name}:`, err);
                }
              }
            }
          } catch (e) {
            console.error("Error parsing subject-level material content", e);
          }
        }

        // Create/Update Subject-level Material
        const existingMaterial = await prisma.material.findFirst({
          where: {
            subjectId: destSubject.id,
            chapterId: null,
            order: sourceMaterial.order
          }
        });

        if (existingMaterial) {
          await prisma.material.update({
            where: { id: existingMaterial.id },
            data: {
              title: sourceMaterial.title,
              type: sourceMaterial.type,
              content: hasContent ? JSON.stringify(materialContent) : sourceMaterial.content,
            }
          });
        } else {
          await prisma.material.create({
            data: {
              chapterId: null,
              subjectId: destSubject.id,
              title: sourceMaterial.title,
              type: sourceMaterial.type,
              content: hasContent ? JSON.stringify(materialContent) : sourceMaterial.content,
              order: sourceMaterial.order,
              isCompleted: false
            }
          });
        }
      }

      // 6. Log activity
      await prisma.driveActivity.create({
        data: {
          driveId: toDrive.id,
          userId: userId,
          action: 'import',
          targetType: 'subject',
          targetId: destSubject.id,
          targetName: destSubject.name,
          metadata: JSON.stringify({
            fromUserId,
            sourceSubjectId: sourceSubject.id,
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
      importedCount: importResult.imported.length,
      duplicatesCount: importResult.duplicates.length,
      skippedCount: importResult.skipped.length,
      totalSize: importResult.totalSize.toString(),
      duplicateReport: importResult.duplicates,
      skippedDetails: importResult.duplicates.map((d: any) => ({ name: d.name, reason: d.reason })),
      files: JSON.parse(JSON.stringify(importResult.imported, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )),
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
  // For imports, we need to create a NEW file with a NEW storedName
  // because storedName is globally unique and we can't share files across drives
  const originalStoredName = sourceFile.storedName || sourceFile.fileName;
  const extension = path.extname(originalStoredName);
  const newStoredName = `${Date.now()}-${Math.random().toString(36).substring(7)}${extension}`;

  // Determine source path
  const sourcePath = path.isAbsolute(sourceFile.filePath)
    ? sourceFile.filePath
    : path.join(process.cwd(), sourceFile.filePath);

  // Determine destination path (same directory structure as source usually, or a dedicated upload dir)
  // Let's reuse the directory of the source file if possible, or default to public/uploads
  const uploadDir = path.dirname(sourcePath);
  const newFilePath = path.join(uploadDir, newStoredName);

  // If we can't determine a good path, default to standard upload location
  // But since we are copying, we can just put it in public/uploads if we want to be safe
  // actually, let's just use the same folder to keep it simple, assuming it's writable

  try {
    await copyFile(sourcePath, newFilePath, constants.COPYFILE_FICLONE);
  } catch (err) {
    console.error("Failed to copy file physically:", err);
    // Fallback: if copy fails (e.g. permissions), we might have to fail the import 
    // or duplicate the buffer (slower). 
    // For now, let's throw to avoid creating broken records.
    throw new Error(`Failed to copy physical file: ${sourceFile.originalName}`);
  }

  const copiedFile = await prisma.driveFile.create({
    data: {
      driveId: targetDriveId,
      folderId: targetFolderId,
      originalName: customName || sourceFile.originalName,
      storedName: newStoredName,
      fileSize: sourceFile.fileSize,
      mimeType: sourceFile.mimeType,
      fileType: sourceFile.fileType,
      fileHash: sourceFile.fileHash || '',
      filePath: newFilePath, // NEW independent path
      thumbnailPath: sourceFile.thumbnailPath, // Thumbnails can potentially be shared or copied too. 
      // Attempting to copy thumbnail would be good but optional.
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
        originalStoredName: originalStoredName,
      }),
    },
  });

  return copiedFile;
}

/**
 * Helper to ensure a folder exists in Drive during import
 */
async function ensureImportFolderExists(driveId: string, parentId: string, name: string) {
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
