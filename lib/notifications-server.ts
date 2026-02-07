import { prisma } from "./prisma";
import { pusherServer } from "./pusher";

export type NotificationType = "message" | "channel_message" | "like" | "comment" | "follow" | "reminder" | "achievement" | "deadline" | "goal";

interface CreateNotificationParams {
    userId: string;
    senderId?: string;
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
}

export async function createNotification({
    userId,
    senderId,
    type,
    title,
    message,
    actionUrl,
}: CreateNotificationParams) {
    try {
        // 1. Create notification in database
        const notification = await prisma.notification.create({
            data: {
                userId,
                senderId,
                type,
                title,
                message,
                actionUrl,
                read: false,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    }
                }
            }
        });

        // 2. Trigger real-time update via Pusher
        if (pusherServer) {
            await pusherServer.trigger(`user-${userId}`, "new-notification", {
                ...notification,
                timestamp: notification.timestamp.toISOString(),
            });
        }

        return notification;
    } catch (error) {
        console.error("[CREATE_NOTIFICATION_ERROR]", error);
        return null;
    }
}

/**
 * Utility to notify all members of a community except the sender
 */
export async function notifyCommunityMembers({
    communityId,
    senderId,
    type,
    title,
    message,
    actionUrl,
}: Omit<CreateNotificationParams, "userId"> & { communityId: string }) {
    try {
        // Fetch all members of the community
        const members = await prisma.communityMember.findMany({
            where: {
                communityId,
                userId: { not: senderId } // Don't notify the sender
            },
            select: {
                userId: true
            }
        });

        // Create notifications in bulk (or sequence for Pusher triggers)
        // For now, we'll do sequence to ensure everyone gets the Pusher event
        // In a high-traffic app, this would be a background job
        const notificationPromises = members.map(member =>
            createNotification({
                userId: member.userId,
                senderId,
                type,
                title,
                message,
                actionUrl
            })
        );

        await Promise.all(notificationPromises);
    } catch (error) {
        console.error("[NOTIFY_COMMUNITY_MEMBERS_ERROR]", error);
    }
}
