import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/drive/folders
 * List folders with hierarchy
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
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

    if (parentId) {
      where.parentId = parentId;
    } else if (parentId === null) {
      // Root folders only
      where.parentId = null;
    }

    // Get folders with pagination
    const [folders, total] = await Promise.all([
      prisma.driveFolder.findMany({
        where,
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              path: true,
            },
          },
          children: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              path: true,
              isPublic: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          files: {
            where: { deletedAt: null },
            select: {
              id: true,
              originalName: true,
              fileSize: true,
              mimeType: true,
              fileType: true,
              isPublic: true,
              createdAt: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.driveFolder.count({ where }),
    ]);

    // Convert BigInt to string for files
    const foldersWithConvertedSizes = folders.map(folder => ({
      ...folder,
      files: folder.files.map(file => ({
        ...file,
        fileSize: file.fileSize.toString(),
      })),
    }));

    return NextResponse.json({
      folders: foldersWithConvertedSizes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listing folders:', error);
    return NextResponse.json(
      { error: 'Failed to list folders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drive/folders
 * Create a new folder
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, parentId, isPublic, subjectId } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
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

    const currentDrive = drive || await prisma.drive.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentDrive) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    }

    // Verify parent folder exists and belongs to user
    let parentPath = '';
    if (parentId) {
      const parentFolder = await prisma.driveFolder.findFirst({
        where: {
          id: parentId,
          driveId: currentDrive.id,
          deletedAt: null,
        },
      });

      if (!parentFolder) {
        return NextResponse.json(
          { error: 'Parent folder not found' },
          { status: 404 }
        );
      }
      parentPath = parentFolder.path;
    }

    // Check if folder with same name already exists in parent
    const existingFolder = await prisma.driveFolder.findFirst({
      where: {
        driveId: currentDrive.id,
        parentId: parentId || null,
        name,
        deletedAt: null,
      },
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: 'Folder with this name already exists' },
        { status: 409 }
      );
    }

    // Verify subject exists if provided
    if (subjectId) {
      const subject = await prisma.subject.findFirst({
        where: {
          id: subjectId,
          userId: session.user.id,
        },
      });

      if (!subject) {
        return NextResponse.json(
          { error: 'Subject not found' },
          { status: 404 }
        );
      }
    }

    // Build folder path
    const folderPath = parentPath ? `${parentPath}/${name}` : name;

    // Create folder
    const newFolder = await prisma.driveFolder.create({
      data: {
        driveId: currentDrive.id,
        parentId: parentId || null,
        name,
        path: folderPath,
        isPublic: isPublic || false,
        subjectId: subjectId || null,
      },
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
        driveId: currentDrive.id,
        userId: session.user.id,
        action: 'upload',
        targetType: 'folder',
        targetId: newFolder.id,
        targetName: name,
        metadata: JSON.stringify({
          parentId,
          path: folderPath,
        }),
      },
    });

    return NextResponse.json({ folder: newFolder }, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}
