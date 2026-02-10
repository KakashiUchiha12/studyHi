import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateName, buildPath } from '@/lib/drive/path-validator';
import { sanitizeName } from '@/lib/drive/sanitizer';
import { validateSession } from '@/lib/drive/auth-validator';
import { DriveErrors } from '@/lib/drive/errors';
import { checkRateLimit } from '@/lib/drive/rate-limiter';

/**
 * GET /api/drive/folders
 * List folders with hierarchy
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
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

    if (parentId && parentId !== '') {
      where.parentId = parentId;
    } else {
      // Root folders only
      where.parentId = null;
    }

    // Get user's subjects that don't have a drive folder yet
    if (!parentId || parentId === '') {
      const subjects = await prisma.subject.findMany({
        where: {
          userId: user.id,
          driveFolders: {
            none: { driveId: drive.id, deletedAt: null }
          }
        }
      });

      // Create drive folders for these subjects automatically
      if (subjects.length > 0) {
        for (const subject of subjects) {
          // Check if folder already exists (including soft-deleted)
          const existing = await prisma.driveFolder.findFirst({
            where: {
              driveId: drive.id,
              subjectId: subject.id
            }
          });

          if (existing) {
            // If was deleted, restore it
            if (existing.deletedAt) {
              await prisma.driveFolder.update({
                where: { id: existing.id },
                data: { deletedAt: null }
              });
            }
            // Otherwise it already exists, skip
          } else {
            // Create new folder
            await prisma.driveFolder.create({
              data: {
                driveId: drive.id,
                name: `Subjects - ${subject.name}`,
                path: `Subjects - ${subject.name}`,
                subjectId: subject.id,
                isPublic: false
              }
            });
          }
        }
      }
    }

    // Get folders with pagination
    const [folders, total] = await Promise.all([
      prisma.driveFolder.findMany({
        where: {
          ...where,
          // If at root, we also want to explicitly include subject folders 
          // even if they were just created above
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              path: true,
            },
          },
          _count: {
            select: {
              files: { where: { deletedAt: null } },
              children: { where: { deletedAt: null } },
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
              color: true
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.driveFolder.count({ where }),
    ]);

    // Add folderType and format response
    const formattedFolders = folders.map(folder => ({
      ...folder,
      folderType: folder.subjectId ? 'subject' : 'regular',
      // Ensure compatible structure for UI
      files: [] // No need to return nested files here as they are fetched separately
    }));

    return NextResponse.json({
      folders: formattedFolders,
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
    const user = session?.user as any;
    if (!user?.id) {
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
      where: { userId: user.id },
    });

    if (!drive) {
      // Create drive if it doesn't exist
      const newDrive = await prisma.drive.create({
        data: {
          userId: user.id,
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
      where: { userId: user.id },
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
          userId: user.id,
        },
      });

      if (!subject) {
        return NextResponse.json(
          { error: 'Subject not found' },
          { status: 404 }
        );
      }
    }

    // Build folder path with "Subjects" prefix for subject folders
    const folderName = subjectId ? `Subjects - ${name}` : name;
    const folderPath = parentPath ? `${parentPath}/${folderName}` : folderName;

    // Create folder
    const newFolder = await prisma.driveFolder.create({
      data: {
        driveId: currentDrive.id,
        parentId: parentId || null,
        name: folderName,
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
        userId: user.id,
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
