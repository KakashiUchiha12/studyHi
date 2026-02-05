import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const userId = (session.user as any).id;

        // Get unique users involved in DMs with current user
        // We'll fetch messages where current user is sender OR receiver
        // Then group by the OTHER party

        // Prisma doesn't support complex group by with relations easily in one go for "Recent Conversations" logic 
        // that is perfect, but we can approximate by getting distinct receiverIds from sent messages 
        // and senderIds from received messages.

        // Better approach: Find all messages involving user, sort by date desc, then process in code to get unique conversations.
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: userId, receiverId: { not: null } },
                    { receiverId: userId }
                ]
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                sender: {
                    select: { id: true, name: true, image: true }
                },
                receiver: {
                    select: { id: true, name: true, image: true }
                }
            },
            take: 100 // Limit to recent 100 messages to extract conversations
        });

        const conversationMap = new Map();

        messages.forEach(msg => {
            if (!msg.receiverId) return; // Should be DM

            const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
            if (!otherUser) return;

            if (!conversationMap.has(otherUser.id)) {
                conversationMap.set(otherUser.id, {
                    user: otherUser,
                    lastMessage: msg.content,
                    lastMessageAt: msg.createdAt,
                    unreadCount: (msg.receiverId === userId && !msg.isRead) ? 1 : 0
                });
            } else {
                // Update unread count if applicable
                if (msg.receiverId === userId && !msg.isRead) {
                    const existing = conversationMap.get(otherUser.id);
                    existing.unreadCount += 1;
                }
            }
        });

        const conversations = Array.from(conversationMap.values());

        return NextResponse.json(conversations);
    } catch (error) {
        console.error("[CONVERSATIONS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
