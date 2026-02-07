import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";
import { parse } from "url";

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
            // Use the singleton instance to prevent multiple connections
            const { dbService } = await import("./lib/database/database-service");
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
                            }
                        }
                    });

                    io.to(message.channelId).emit("new-message", savedMessage);

                    // Notify all community members
                    const { notifyCommunityMembers } = await import("./lib/notifications-server");
                    const channel = await prisma.channel.findUnique({
                        where: { id: message.channelId },
                        select: { communityId: true, name: true }
                    });

                    if (channel) {
                        await notifyCommunityMembers({
                            communityId: channel.communityId,
                            senderId: message.senderId,
                            type: "channel_message",
                            title: `New message in #${channel.name}`,
                            message: `${savedMessage.sender.name}: ${message.content.substring(0, 50)}${message.content.length > 50 ? "..." : ""}`,
                            actionUrl: `/community/${channel.communityId}` // Adjust if you have a specific channel URL
                        });
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

                    // Emit to both sender and receiver so it updates instantly for both
                    io.to(`user:${message.receiverId}`).emit("new-dm", savedMessage);
                    io.to(`user:${message.senderId}`).emit("new-dm", savedMessage);

                    // Create real-time notification for receiver
                    const { createNotification } = await import("./lib/notifications-server");
                    await createNotification({
                        userId: message.receiverId,
                        senderId: message.senderId,
                        type: "message",
                        title: "New Message",
                        message: `${savedMessage.sender.name}: ${message.content.substring(0, 50)}${message.content.length > 50 ? "..." : ""}`,
                        actionUrl: `/messages/${message.senderId}`
                    });
                }
            } catch (error) {
                console.error("Error saving message:", error);
            }
            // Do not disconnect, keep the pool alive
        });

        socket.on("disconnect", () => {
            // console.log("Socket disconnected:", socket.id);
        });
    });

    httpServer.listen(port, () => {
        console.log(
            `> Ready on http://localhost:${port} as ${dev ? "development" : "production"}`
        );
    });
});
