import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Helper function to create notification
export async function createDriveNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    metadata?: any;
}) {
    return await prisma.notification.create({
        data: {
            userId: data.userId,
            type: data.type,
            title: data.title,
            message: data.message,
            link: data.link,
            metadata: JSON.stringify(data.metadata || {}),
            read: false,
        },
    });
}

// GET - Fetch Drive-related notifications
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Fetch Drive notifications
        const notifications = await prisma.notification.findMany({
            where: {
                userId,
                type: {
                    in: [
                        'DRIVE_COPY_REQUEST',
                        'DRIVE_COPY_APPROVED',
                        'DRIVE_COPY_DENIED',
                        'DRIVE_DOWNLOAD',
                        'DRIVE_STORAGE_WARNING',
                        'DRIVE_BANDWIDTH_WARNING',
                    ],
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 50,
        });

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error('Error fetching Drive notifications:', error);
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        );
    }
}

// POST - Create Drive notification (internal use)
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { userId, type, title, message, link, metadata } = body;

        const notification = await createDriveNotification({
            userId,
            type,
            title,
            message,
            link,
            metadata,
        });

        return NextResponse.json({ notification });
    } catch (error) {
        console.error('Error creating notification:', error);
        return NextResponse.json(
            { error: 'Failed to create notification' },
            { status: 500 }
        );
    }
}

// PATCH - Mark notification as read
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const body = await req.json();
        const { notificationId } = body;

        // Verify ownership and mark as read
        const notification = await prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId,
            },
            data: {
                read: true,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return NextResponse.json(
            { error: 'Failed to update notification' },
            { status: 500 }
        );
    }
}
