import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/drive/copy-request - List copy requests
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'sent', 'received', 'all'
    const status = searchParams.get('status'); // 'PENDING', 'APPROVED', 'DENIED'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (filter === 'sent') {
      where.fromUserId = session.user.id;
    } else if (filter === 'received') {
      where.toUserId = session.user.id;
    } else {
      // All: either sent or received
      where.OR = [
        { fromUserId: session.user.id },
        { toUserId: session.user.id },
      ];
    }

    // Get copy requests with pagination
    const [copyRequests, total] = await Promise.all([
      prisma.copyRequest.findMany({
        where,
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          toUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.copyRequest.count({ where }),
    ]);

    return NextResponse.json({
      copyRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listing copy requests:', error);
    return NextResponse.json(
      { error: 'Failed to list copy requests' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drive/copy-request - Create a copy request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { toUserId, requestType, targetId, message } = body;

    if (!toUserId || !requestType || !targetId) {
      return NextResponse.json(
        { error: 'Missing required fields: toUserId, requestType, targetId' },
        { status: 400 }
      );
    }

    if (!['subject', 'file', 'folder'].includes(requestType)) {
      return NextResponse.json(
        { error: 'Invalid requestType. Must be subject, file, or folder.' },
        { status: 400 }
      );
    }

    // Get requester's drive
    const fromDrive = await prisma.drive.findUnique({
      where: { userId: session.user.id },
    });

    if (!fromDrive) {
      return NextResponse.json(
        { error: 'Your drive not found' },
        { status: 404 }
      );
    }

    // Get target user's drive
    const toDrive = await prisma.drive.findUnique({
      where: { userId: toUserId },
    });

    if (!toDrive) {
      return NextResponse.json(
        { error: 'Target user drive not found' },
        { status: 404 }
      );
    }

    // Check if target user allows copying
    if (toDrive.allowCopying === 'DENY') {
      return NextResponse.json(
        { error: 'User does not allow copying from their drive' },
        { status: 403 }
      );
    }

    // Verify target exists based on type
    if (requestType === 'file') {
      const file = await prisma.driveFile.findFirst({
        where: {
          id: targetId,
          driveId: toDrive.id,
          deletedAt: null,
        },
      });

      if (!file) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        );
      }

      // Check if file is public
      if (file.isPublic && toDrive.allowCopying === 'ALLOW') {
        // No need for request, can copy directly
        return NextResponse.json(
          { error: 'File is public and copying is allowed. No request needed.' },
          { status: 400 }
        );
      }
    } else if (requestType === 'folder') {
      const folder = await prisma.driveFolder.findFirst({
        where: {
          id: targetId,
          driveId: toDrive.id,
          deletedAt: null,
        },
      });

      if (!folder) {
        return NextResponse.json(
          { error: 'Folder not found' },
          { status: 404 }
        );
      }
    } else if (requestType === 'subject') {
      const subject = await prisma.subject.findFirst({
        where: {
          id: targetId,
          userId: toUserId,
        },
      });

      if (!subject) {
        return NextResponse.json(
          { error: 'Subject not found' },
          { status: 404 }
        );
      }
    }

    // Check if a similar request already exists
    const existingRequest = await prisma.copyRequest.findFirst({
      where: {
        fromUserId: session.user.id,
        toUserId,
        requestType,
        targetId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'A pending copy request already exists for this item' },
        { status: 409 }
      );
    }

    // Create copy request
    const copyRequest = await prisma.copyRequest.create({
      data: {
        fromUserId: session.user.id,
        toUserId,
        fromDriveId: fromDrive.id,
        toDriveId: toDrive.id,
        requestType,
        targetId,
        message: message || null,
        status: 'PENDING',
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(
      { copyRequest },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating copy request:', error);
    return NextResponse.json(
      { error: 'Failed to create copy request' },
      { status: 500 }
    );
  }
}
