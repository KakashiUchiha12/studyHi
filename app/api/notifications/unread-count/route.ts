import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = (session.user as any).id;

        const [notificationCount, messageCount] = await Promise.all([
            prisma.notification.count({
                where: {
                    userId,
                    read: false
                }
            }),
            prisma.message.count({
                where: {
                    receiverId: userId, // Direct messages
                    isRead: false
                }
            })
        ]);

        return NextResponse.json({
            notifications: notificationCount,
            messages: messageCount
        });
    } catch (error) {
        console.error("[UNREAD_COUNT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
