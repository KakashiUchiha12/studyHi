import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { calculateBufferHash } from '@/lib/drive/file-hash';
import {
  STORAGE_LIMITS,
  validateFileSize,
  isStorageLimitExceeded,
} from '@/lib/drive/storage';
import { validateSession } from '@/lib/drive/auth-validator';
import { sanitizeTags, sanitizeName } from '@/lib/drive/sanitizer';
import { DriveErrors } from '@/lib/drive/errors';
import { checkRateLimit } from '@/lib/drive/rate-limiter';

/**
 * GET /api/drive/files
 * List files with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;

    // Get user's drive
    const drive = await prisma.drive.findUnique({
      where: { userId: user.id },
    });

    if (!drive) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    }

    // Build where clause
    const where: any = {
      driveId: drive.id,
      deletedAt: null,
    };

    if (folderId && folderId !== '') {
      where.folderId = folderId;
    } else {
      // Root folder
      where.folderId = null;
    }

    if (search) {
      where.OR = [
        { originalName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get files with pagination
    const [files, total] = await Promise.all([
      prisma.driveFile.findMany({
        where,
        include: {
          folder: {
            select: {
              id: true,
              name: true,
              path: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.driveFile.count({ where }),
    ]);

    // Parse tags from JSON strings
    const filesWithParsedTags = files.map(file => ({
      ...file,
      tags: (() => {
        try {
          return JSON.parse(file.tags);
        } catch {
          return [];
        }
      })(),
      fileSize: file.fileSize.toString(),
    }));

    return NextResponse.json({
      files: filesWithParsedTags,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting files:', error);
    return NextResponse.json(
      { error: 'Failed to get files' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drive/files
 * Upload a file
 */
export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session = await getServerSession(authOptions);
    const user = validateSession(session);

    // Rate limit check
    const rateLimit = checkRateLimit(user.id, 'fileUpload');
    if (!rateLimit.allowed) {
      const error = DriveErrors.rateLimitExceeded('file upload', rateLimit.resetTime!);
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string | null;
    const tagsString = formData.get('tags') as string | null;
    const description = formData.get('description') as string | null;

    if (!file) {
      const error = DriveErrors.invalidInput('file', 'No file provided');
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    // Validate file size
    const sizeValidation = validateFileSize(file.size);
    if (!sizeValidation.valid) {
      const error = DriveErrors.fileTooLarge(file.size, STORAGE_LIMITS.FILE_SIZE_LIMIT);
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    // Sanitize inputs
    const sanitizedTags = sanitizeTags(tagsString || '[]');
    const sanitizedName = sanitizeName(file.name);

    // Get user's drive
    const drive = await prisma.drive.findUnique({
      where: { userId: user.id },
    });

    if (!drive) {
      const error = DriveErrors.driveNotFound();
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    // Check storage limits
    if (isStorageLimitExceeded(drive.storageUsed, drive.storageLimit, file.size)) {
      const error = DriveErrors.storageExceeded(
        `${Number(drive.storageUsed) / 1024 / 1024}MB`,
        `${Number(drive.storageLimit) / 1024 / 1024}MB`
      );
      return NextResponse.json(error.toJSON(), { status: error.status });
    }

    // Create unique file name and path
    const fileId = uuidv4();
    const extension = path.extname(file.name);
    const fileName = `${fileId}${extension}`;
    const date = new Date();
    const relativeDir = path.join('uploads', 'drives', user.id, date.getFullYear().toString(), (date.getMonth() + 1).toString());
    const uploadDir = path.join(process.cwd(), relativeDir);

    // Create directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(relativeDir, fileName);
    const fullPath = path.join(process.cwd(), filePath);

    // Save file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(fullPath, buffer);

    // Calculate hash
    const hash = calculateBufferHash(buffer);

    // Generate thumbnail
    let thumbnailPath = null;
    try {
      const { ThumbnailService } = await import('@/lib/drive/thumbnail-service');
      const thumbBuffer = await ThumbnailService.generateThumbnail(buffer, file.type || 'application/octet-stream');

      if (thumbBuffer) {
        const thumbRelDir = await ThumbnailService.ensureThumbnailDir(user.id);
        const thumbName = `${fileId}_thumb.webp`;
        thumbnailPath = path.join(thumbRelDir, thumbName).replace(/\\/g, '/');

        const fullThumbPath = path.join(process.cwd(), thumbnailPath);
        await writeFile(fullThumbPath, thumbBuffer);
      }
    } catch (error) {
      console.error('Failed to generate thumbnail during upload:', error);
    }

    // Create database record and update storage in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create file record
      const newFile = await tx.driveFile.create({
        data: {
          driveId: drive.id,
          folderId: folderId || null,
          originalName: file.name,
          storedName: fileName,
          filePath: filePath.replace(/\\/g, '/'), // Use forward slashes
          thumbnailPath,
          fileSize: BigInt(file.size),
          mimeType: file.type || 'application/octet-stream',
          fileType: extension.slice(1).toUpperCase() || 'FILE',
          fileHash: hash,
          tags: JSON.stringify(sanitizedTags),
        },
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

      // Update storage usage atomically
      await tx.drive.update({
        where: { id: drive.id },
        data: {
          storageUsed: { increment: BigInt(file.size) },
        },
      });

      // Create activity log
      await tx.driveActivity.create({
        data: {
          driveId: drive.id,
          userId: user.id,
          action: 'upload',
          targetType: 'file',
          targetId: newFile.id,
          targetName: file.name,
          metadata: JSON.stringify({
            fileSize: file.size,
            mimeType: file.type,
            folderId,
          }),
        },
      });

      return newFile;
    });

    return NextResponse.json({
      file: {
        ...result,
        fileSize: result.fileSize.toString(),
        tags: sanitizedTags,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
