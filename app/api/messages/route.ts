import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { content, fileUrl, fileType, fileName, channelId, receiverId } = body;
        const senderId = (session.user as any).id;

        if (!content && !fileUrl) {
            return new NextResponse("Content or file missing", { status: 400 });
        }

        let savedMessage;

        if (channelId) {
            savedMessage = await prisma.message.create({
                data: {
                    content: content || "",
                    fileUrl,
                    fileType,
                    fileName,
                    channelId,
                    senderId,
                    isRead: false
                },
                include: {
                    sender: {
                        select: { name: true, image: true, id: true }
                    }
                }
            });

            // Note: We are relying on client socket emission for real-time updates for now.
            // A more robust solution would involve emitting from here using a separate socket service.

            return NextResponse.json(savedMessage);

        } else if (receiverId) {
            savedMessage = await prisma.message.create({
                data: {
                    content: content || "",
                    fileUrl,
                    fileType,
                    fileName,
                    receiverId,
                    senderId,
                    isRead: false
                },
                include: {
                    sender: {
                        select: { name: true, image: true, id: true }
                    }
                }
            });

            return NextResponse.json(savedMessage);
        }

        // If we are here, we probably want to support HTTP-based sending?
        // For now, I'll return the saved message.
        return NextResponse.json(savedMessage);

    } catch (error) {
        console.error("[MESSAGES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
