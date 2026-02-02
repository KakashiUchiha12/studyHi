import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MESSAGES_BATCH = 20;

export async function GET(
    req: Request,
    props: { params: Promise<{ userId: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const otherUserId = params.userId;

    try {
        const myId = (session.user as any).id;

        // Mark messages as read
        await prisma.message.updateMany({
            where: {
                senderId: otherUserId,
                receiverId: myId,
                isRead: false
            },
            data: {
                isRead: true
            }
        });

        const whereClause = {
            OR: [
                { senderId: myId, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: myId }
            ]
        };

        let messages;

        if (cursor) {
            messages = await prisma.message.findMany({
                take: MESSAGES_BATCH,
                skip: 1,
                cursor: { id: cursor },
                where: whereClause,
                include: {
                    sender: {
                        select: { name: true, image: true, id: true }
                    }
                },
                orderBy: { createdAt: "desc" }
            });
        } else {
            messages = await prisma.message.findMany({
                take: MESSAGES_BATCH,
                where: whereClause,
                include: {
                    sender: {
                        select: { name: true, image: true, id: true }
                    }
                },
                orderBy: { createdAt: "desc" }
            });
        }

        let nextCursor = null;

        if (messages.length === MESSAGES_BATCH) {
            nextCursor = messages[MESSAGES_BATCH - 1].id;
        }

        return NextResponse.json({
            items: messages,
            nextCursor
        });

    } catch (error) {
        console.error("[DIRECT_MESSAGES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
