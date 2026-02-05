// Notification helper functions for Drive events
import { prisma } from '@/lib/prisma';

export async function notifyCopyRequest(data: {
    fromUserId: string;
    toUserId: string;
    itemName: string;
    requestId: string;
}) {
    await prisma.notification.create({
        data: {
            userId: data.toUserId,
            type: 'DRIVE_COPY_REQUEST',
            title: 'Copy Request Received',
            message: `Someone wants to copy "${data.itemName}" from your drive`,
            link: `/drive?requestId=${data.requestId}`,
            metadata: JSON.stringify({
                fromUserId: data.fromUserId,
                requestId: data.requestId,
            }),
            read: false,
        },
    });
}

export async function notifyCopyApproved(data: {
    userId: string;
    itemName: string;
    approverName: string;
}) {
    await prisma.notification.create({
        data: {
            userId: data.userId,
            type: 'DRIVE_COPY_APPROVED',
            title: 'Copy Request Approved',
            message: `${data.approverName} approved your request to copy "${data.itemName}"`,
            link: '/drive',
            read: false,
        },
    });
}

export async function notifyCopyDenied(data: {
    userId: string;
    itemName: string;
  denier Name: string;
}) {
    await prisma.notification.create({
        data: {
            userId: data.userId,
            type: 'DRIVE_COPY_DENIED',
            title: 'Copy Request Denied',
            message: `${data.denierName} denied your request to copy "${data.itemName}"`,
            link: '/drive',
            read: false,
        },
    });
}

export async function notifyDownload(data: {
    ownerId: string;
    downloaderName: string;
    fileName: string;
}) {
    await prisma.notification.create({
        data: {
            userId: data.ownerId,
            type: 'DRIVE_DOWNLOAD',
            title: 'Document Downloaded',
            message: `${data.downloaderName} downloaded "${data.fileName}"`,
            link: '/drive/activity',
            read: false,
        },
    });
}

export async function notifyStorageWarning(data: {
    userId: string;
    percentage: number;
    used: string;
    limit: string;
}) {
    await prisma.notification.create({
        data: {
            userId: data.userId,
            type: 'DRIVE_STORAGE_WARNING',
            title: 'Storage Limit Warning',
            message: `Your drive is ${data.percentage}% full (${data.used} of ${data.limit} used)`,
            link: '/drive',
            read: false,
        },
    });
}

export async function notifyBandwidthLimit(data: {
    userId: string;
    resetTime: Date;
}) {
    const hours = Math.ceil((resetTime.getTime() - Date.now()) / (1000 * 60 * 60));

    await prisma.notification.create({
        data: {
            userId: data.userId,
            type: 'DRIVE_BANDWIDTH_WARNING',
            title: 'Bandwidth Limit Reached',
            message: `You've reached your 10GB daily bandwidth limit. Resets in ${hours} hours.`,
            link: '/drive',
            read: false,
        },
    });
}
