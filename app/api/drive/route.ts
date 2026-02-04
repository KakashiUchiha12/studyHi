import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { STORAGE_LIMITS, calculateStoragePercentage } from '@/lib/drive/storage';

/**
 * GET /api/drive - Get drive info
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create drive
    let drive = await prisma.drive.findUnique({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: {
            files: { where: { deletedAt: null } },
            folders: { where: { deletedAt: null } },
          },
        },
      },
    });

    // Create drive if it doesn't exist
    if (!drive) {
      drive = await prisma.drive.create({
        data: {
          userId: session.user.id,
        },
        include: {
          _count: {
            select: {
              files: { where: { deletedAt: null } },
              folders: { where: { deletedAt: null } },
            },
          },
        },
      });
    }

    const storagePercentage = calculateStoragePercentage(drive.storageUsed, drive.storageLimit);

    return NextResponse.json({
      drive: {
        id: drive.id,
        storageUsed: drive.storageUsed.toString(),
        storageLimit: drive.storageLimit.toString(),
        storagePercentage,
        bandwidthUsed: drive.bandwidthUsed.toString(),
        bandwidthLimit: drive.bandwidthLimit.toString(),
        bandwidthReset: drive.bandwidthReset,
        isPrivate: drive.isPrivate,
        allowCopying: drive.allowCopying,
        fileCount: drive._count.files,
        folderCount: drive._count.folders,
        createdAt: drive.createdAt,
        updatedAt: drive.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error getting drive info:', error);
    return NextResponse.json(
      { error: 'Failed to get drive info' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drive - Initialize drive (usually done automatically)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if drive already exists
    const existingDrive = await prisma.drive.findUnique({
      where: { userId: session.user.id },
    });

    if (existingDrive) {
      return NextResponse.json(
        { error: 'Drive already exists' },
        { status: 400 }
      );
    }

    // Create new drive
    const drive = await prisma.drive.create({
      data: {
        userId: session.user.id,
        storageLimit: BigInt(STORAGE_LIMITS.USER_STORAGE_LIMIT),
        bandwidthLimit: BigInt(STORAGE_LIMITS.DAILY_BANDWIDTH_LIMIT),
      },
    });

    return NextResponse.json({
      drive: {
        id: drive.id,
        storageUsed: drive.storageUsed.toString(),
        storageLimit: drive.storageLimit.toString(),
        bandwidthUsed: drive.bandwidthUsed.toString(),
        bandwidthLimit: drive.bandwidthLimit.toString(),
        bandwidthReset: drive.bandwidthReset,
        isPrivate: drive.isPrivate,
        allowCopying: drive.allowCopying,
        createdAt: drive.createdAt,
        updatedAt: drive.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating drive:', error);
    return NextResponse.json(
      { error: 'Failed to create drive' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/drive - Update drive settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isPrivate, allowCopying } = body;

    const updateData: any = {};
    if (typeof isPrivate === 'boolean') {
      updateData.isPrivate = isPrivate;
    }
    if (allowCopying && ['ALLOW', 'REQUEST', 'DENY'].includes(allowCopying)) {
      updateData.allowCopying = allowCopying;
    }

    const drive = await prisma.drive.update({
      where: { userId: session.user.id },
      data: updateData,
    });

    return NextResponse.json({
      drive: {
        id: drive.id,
        isPrivate: drive.isPrivate,
        allowCopying: drive.allowCopying,
        updatedAt: drive.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating drive:', error);
    return NextResponse.json(
      { error: 'Failed to update drive' },
      { status: 500 }
    );
  }
}
