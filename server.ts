import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { parse } from "url";
import path from "path";
import { loadEnvConfig } from "@next/env";

// Load environment variables immediately
const { combinedEnv } = loadEnvConfig(process.cwd());
console.log("[SERVER] Environment variables loaded");

import { dbService } from "./lib/database/database-service";

// Simple text sanitization to prevent XSS in notifications
function sanitizeText(text: string | null | undefined): string {
    if (!text) return '';
    return text
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

// Truncate message content for notifications
function truncateMessage(content: string, maxLength: number = 50): string {
    if (content.length <= maxLength) return content;
    return `${content.substring(0, maxLength)}...`;
}

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer, {
        path: "/api/socket/io",
        addTrailingSlash: false,
    });

    io.on("connection", (socket) => {
        socket.on("join-channel", (channelId: string) => {
            socket.join(channelId);
        });

        socket.on("leave-channel", (channelId: string) => {
            socket.leave(channelId);
        });

        socket.on("join-user-room", (userId: string) => {
            socket.join(`user:${userId}`);
        });

        socket.on("send-message", async (message) => {
            console.log(`[SOCKET] send-message received from ${message.senderId}`);
            const prisma = dbService.getPrisma();

            try {
                if (message.channelId && message.senderId && message.content) {
                    // Channel Message
                    const savedMessage = await prisma.message.create({
                        data: {
                            content: message.content,
                            channelId: message.channelId,
                            senderId: message.senderId,
                            isRead: false
                        },
                        include: {
                            sender: {
                                select: { name: true, image: true, id: true }
                            },
                            channel: {
                                select: {
                                    name: true,
                                    communityId: true,
                                    community: {
                                        select: {
                                            name: true,
                                            members: {
                                                select: { userId: true }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });

                    // Create notifications for all community members except the sender
                    const memberIds = savedMessage.channel.community.members
                        .map(m => m.userId)
                        .filter(userId => userId !== message.senderId);

                    if (memberIds.length > 0) {
                        const truncatedContent = truncateMessage(message.content || '');
                        const sanitizedContent = sanitizeText(truncatedContent);
                        await prisma.notification.createMany({
                            data: memberIds.map(userId => ({
                                userId,
                                type: 'message',
                                title: `New message in #${savedMessage.channel.name}`,
                                message: `${savedMessage.sender.name || 'Someone'}: ${sanitizedContent}`,
                                actionUrl: '/social',
                                timestamp: new Date(),
                                read: false
                            }))
                        });

                        // Emit notification event to each member
                        memberIds.forEach(userId => {
                            io.to(`user:${userId}`).emit("new-notification", {
                                type: 'message',
                                title: `New message in #${savedMessage.channel.name}`,
                                message: `${savedMessage.sender.name || 'Someone'}: ${sanitizedContent}`,
                                actionUrl: '/social'
                            });
                        });
                    }

                    io.to(message.channelId).emit("new-message", savedMessage);

                    // Notify all community members
                    const channel = await prisma.channel.findUnique({
                        where: { id: message.channelId },
                        select: { communityId: true, name: true }
                    });

                    if (channel) {
                        try {
                            const libPath = __dirname.endsWith('dist') ? path.join(__dirname, 'lib') : path.join(__dirname, 'lib');
                            const { notifyCommunityMembers } = await import(path.join(libPath, "notifications-server"));

                            await notifyCommunityMembers({
                                communityId: channel.communityId,
                                senderId: message.senderId,
                                type: "channel_message",
                                title: `New message in #${channel.name}`,
                                message: `${savedMessage.sender.name}: ${message.content.substring(0, 50)}${message.content.length > 50 ? "..." : ""}`,
                                actionUrl: `/community/${channel.communityId}`
                            });
                            console.log(`[SOCKET] Channel notification triggered for ${channel.name}`);
                        } catch (err) {
                            console.error("[SOCKET] Failed to trigger community notification:", err);
                        }
                    }
                } else if (message.receiverId && message.senderId && message.content) {
                    // Direct Message
                    const savedMessage = await prisma.message.create({
                        data: {
                            content: message.content,
                            receiverId: message.receiverId,
                            senderId: message.senderId,
                            isRead: false
                        },
                        include: {
                            sender: {
                                select: { name: true, image: true, id: true }
                            }
                        }
                    });

                    // Create a notification for the receiver about the new message
                    const truncatedContent = truncateMessage(message.content || '');
                    const sanitizedContent = sanitizeText(truncatedContent);
                    await prisma.notification.create({
                        data: {
                            userId: message.receiverId,
                            type: 'message',
                            title: 'New Message',
                            message: `${savedMessage.sender.name || 'Someone'} sent you a message: ${sanitizedContent}`,
                            actionUrl: '/social',
                            timestamp: new Date(),
                            read: false
                        }
                    });

                    // Emit notification event to receiver
                    io.to(`user:${message.receiverId}`).emit("new-notification", {
                        type: 'message',
                        title: 'New Message',
                        message: `${savedMessage.sender.name || 'Someone'} sent you a message: ${sanitizedContent}`,
                        actionUrl: '/social'
                    });

                    // Emit to both sender and receiver so it updates instantly for both
                    io.to(`user:${message.receiverId}`).emit("new-dm", savedMessage);
                    io.to(`user:${message.senderId}`).emit("new-dm", savedMessage);
                    console.log(`[SOCKET] DM saved and emitted to user:${message.receiverId}`);

                    // Create real-time notification for receiver
                    try {
                        const libPath = __dirname.endsWith('dist') ? path.join(__dirname, 'lib') : path.join(__dirname, 'lib');
                        const { createNotification } = await import(path.join(libPath, "notifications-server"));

                        await createNotification({
                            userId: message.receiverId,
                            senderId: message.senderId,
                            type: "message",
                            title: "New Message",
                            message: `${savedMessage.sender.name}: ${message.content.substring(0, 50)}${message.content.length > 50 ? "..." : ""}`,
                            actionUrl: `/messages/${message.senderId}`
                        });
                        console.log(`[SOCKET] Notification entry created for DM to ${message.receiverId}`);
                    } catch (err) {
                        console.error("[SOCKET] Failed to create DM notification record:", err);
                    }
                }
            } catch (error) {
                console.error("[SOCKET] Error in send-message handler:", error);
            }
        });

        socket.on("disconnect", () => {
            // console.log("Socket disconnected:", socket.id);
        });
    });

    httpServer.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
});
