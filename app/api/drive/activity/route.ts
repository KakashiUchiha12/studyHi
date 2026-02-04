import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/drive/activity - Get activity feed
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const skip = (page - 1) * limit;
    const action = searchParams.get('action'); // Filter by action (upload, download, delete, etc)

    const drive = await prisma.drive.findUnique({
      where: { userId },
    });

    if (!drive) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    }

    // Build filter
    const where: any = { driveId: drive.id };
    if (action && action !== 'all') {
      where.action = action;
    }

    const [activities, total, stats] = await Promise.all([
      prisma.driveActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),
      prisma.driveActivity.count({
        where,
      }),
      // Get counts for all major categories in one go for badges
      Promise.all([
        prisma.driveActivity.count({ where: { driveId: drive.id } }),
        prisma.driveActivity.count({ where: { driveId: drive.id, action: 'upload' } }),
        prisma.driveActivity.count({ where: { driveId: drive.id, action: 'download' } }),
        prisma.driveActivity.count({ where: { driveId: drive.id, action: 'delete' } }),
      ])
    ]);

    return NextResponse.json({
      activities,
      stats: {
        all: stats[0],
        uploads: stats[1],
        downloads: stats[2],
        deletions: stats[3],
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error getting activity:', error);
    return NextResponse.json({ error: 'Failed to get activity' }, { status: 500 });
  }
}
