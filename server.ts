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
        console.log(`[SERVER] Request: ${req.method} ${req.url}`);
        handle(req, res, parsedUrl);
    });

    const io = new Server(httpServer, {
        path: "/api/socket/io",
        addTrailingSlash: false,
    });

    // Share io instance globally for API routes and utility functions
    (global as any).io = io;

    io.on("connection", (socket) => {
        // console.log("Socket connected:", socket.id);

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
                if (message.channelId && message.senderId && (message.content || message.fileUrl)) {
                    // Channel Message
                    const savedMessage = await prisma.message.create({
                        data: {
                            content: message.content || "",
                            fileUrl: message.fileUrl,
                            fileType: message.fileType,
                            fileName: message.fileName,
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

                    io.to(message.channelId).emit("new-message", savedMessage);

                    // Notify all community members via unified logic
                    if (savedMessage.channel) {
                        try {
                            const libPath = __dirname.endsWith('dist') ? path.join(__dirname, 'lib') : path.join(__dirname, 'lib');
                            const { notifyCommunityMembers } = await import(path.join(libPath, "notifications-server"));

                            await notifyCommunityMembers({
                                communityId: savedMessage.channel.communityId,
                                senderId: message.senderId,
                                type: "channel_message",
                                title: `New message in #${savedMessage.channel.name}`,
                                message: `${savedMessage.sender.name}: ${message.fileUrl ? "Sent a file" : message.content.substring(0, 50)}${message.content.length > 50 ? "..." : ""}`,
                                actionUrl: `/community/${savedMessage.channel.communityId}`
                            });
                            console.log(`[SOCKET] Channel notifications triggered for ${savedMessage.channel.name}`);
                        } catch (err) {
                            console.error("[SOCKET] Failed to trigger community notifications:", err);
                        }
                    }
                } else if (message.receiverId && message.senderId && (message.content || message.fileUrl)) {
                    // Direct Message
                    const savedMessage = await prisma.message.create({
                        data: {
                            content: message.content || "",
                            fileUrl: message.fileUrl,
                            fileType: message.fileType,
                            fileName: message.fileName,
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

                    // Emit to both sender and receiver for instant chat update
                    io.to(`user:${message.receiverId}`).emit("new-dm", savedMessage);
                    io.to(`user:${message.senderId}`).emit("new-dm", savedMessage);
                    console.log(`[SOCKET] DM saved and emitted to users`);

                    // Create real-time notification for receiver via unified logic
                    try {
                        const libPath = __dirname.endsWith('dist') ? path.join(__dirname, 'lib') : path.join(__dirname, 'lib');
                        const { createNotification } = await import(path.join(libPath, "notifications-server"));

                        await createNotification({
                            userId: message.receiverId,
                            senderId: message.senderId,
                            type: "message",
                            title: "New Message",
                            message: `${savedMessage.sender.name}: ${message.fileUrl ? "Sent a file" : message.content.substring(0, 50)}${message.content.length > 50 ? "..." : ""}`,
                            actionUrl: `/messages/${message.senderId}`
                        });
                        console.log(`[SOCKET] DM notification triggered for ${message.receiverId}`);
                    } catch (err) {
                        console.error("[SOCKET] Failed to create DM notification:", err);
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

    httpServer.listen(port, "0.0.0.0", () => {
        console.log(`> Ready on http://192.168.1.3:${port} (Network access enabled)`);
    });
});
