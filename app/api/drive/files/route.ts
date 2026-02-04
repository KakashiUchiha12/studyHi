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

/**
 * GET /api/drive/files
 * List files with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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
      where: { userId: session.user.id },
    });

    if (!drive) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    }

    // Build where clause
    const where: any = {
      driveId: drive.id,
      deletedAt: null,
    };

    if (folderId) {
      where.folderId = folderId;
    } else if (folderId === null) {
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
      tags: JSON.parse(file.tags),
      fileSize: file.fileSize.toString(),
    }));

    return NextResponse.json({
      files: filesWithParsedTags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drive/files
 * Upload a new file
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string | null;
    const description = formData.get('description') as string | null;
    const tags = formData.get('tags') as string | null;
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size
    const validation = validateFileSize(file.size);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Get user's drive
    const drive = await prisma.drive.findUnique({
      where: { userId: session.user.id },
    });

    if (!drive) {
      // Create drive if it doesn't exist
      const newDrive = await prisma.drive.create({
        data: {
          userId: session.user.id,
        },
      });

      if (!newDrive) {
        return NextResponse.json(
          { error: 'Failed to create drive' },
          { status: 500 }
        );
      }
    }

    // Check storage limit
    const currentDrive = drive || await prisma.drive.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentDrive) {
      return NextResponse.json(
        { error: 'Drive not found' },
        { status: 404 }
      );
    }

    if (isStorageLimitExceeded(currentDrive.storageUsed, currentDrive.storageLimit, file.size)) {
      return NextResponse.json(
        { error: 'Storage limit exceeded' },
        { status: 400 }
      );
    }

    // Verify folder exists and belongs to user
    if (folderId) {
      const folder = await prisma.driveFolder.findFirst({
        where: {
          id: folderId,
          driveId: currentDrive.id,
          deletedAt: null,
        },
      });

      if (!folder) {
        return NextResponse.json(
          { error: 'Folder not found' },
          { status: 404 }
        );
      }
    }

    // Read file buffer and calculate hash
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileHash = calculateBufferHash(buffer, 'md5');

    // Check for duplicate files
    const existingFile = await prisma.driveFile.findFirst({
      where: {
        driveId: currentDrive.id,
        fileHash,
        deletedAt: null,
      },
    });

    if (existingFile) {
      return NextResponse.json(
        { error: 'File already exists', existingFile },
        { status: 409 }
      );
    }

    // Generate storage path
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const uploadDir = path.join(
      process.cwd(),
      'uploads',
      'drives',
      session.user.id,
      year.toString(),
      month
    );

    // Create directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const fileExt = path.extname(file.name);
    const storedName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(uploadDir, storedName);
    const relativeFilePath = path.join(
      'uploads',
      'drives',
      session.user.id,
      year.toString(),
      month,
      storedName
    );

    // Write file to disk
    await writeFile(filePath, buffer);

    // Parse tags
    const parsedTags = tags ? JSON.parse(tags) : [];

    // Create file record in database
    const newFile = await prisma.driveFile.create({
      data: {
        driveId: currentDrive.id,
        folderId: folderId || null,
        originalName: file.name,
        storedName,
        fileSize: BigInt(file.size),
        mimeType: file.type || 'application/octet-stream',
        fileType: fileExt.replace('.', ''),
        fileHash,
        filePath: relativeFilePath,
        isPublic,
        description: description || null,
        tags: JSON.stringify(parsedTags),
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

    // Update storage usage
    await prisma.drive.update({
      where: { id: currentDrive.id },
      data: {
        storageUsed: currentDrive.storageUsed + BigInt(file.size),
      },
    });

    // Create activity log
    await prisma.driveActivity.create({
      data: {
        driveId: currentDrive.id,
        userId: session.user.id,
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

    return NextResponse.json({
      file: {
        ...newFile,
        fileSize: newFile.fileSize.toString(),
        tags: parsedTags,
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
