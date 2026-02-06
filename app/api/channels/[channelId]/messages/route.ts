import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function GET(
    req: Request,
    props: { params: Promise<{ channelId: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Verify channel access (member of community)
        const channel = await prisma.channel.findUnique({
            where: { id: params.channelId },
            include: { community: true }
        });

        if (!channel) {
            return new NextResponse("Channel not found", { status: 404 });
        }

        // Check if user is member
        const membership = await prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId: channel.communityId,
                    userId: (session.user as any).id,
                },
            },
        });

        if (!membership && !channel.community.showInSearch && channel.community.isPrivate) {
            // If private community and not member, deny
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Get cursor from query params for pagination
        const { searchParams } = new URL(req.url);
        const cursor = searchParams.get("cursor");

        const messages = await prisma.message.findMany({
            where: {
                channelId: params.channelId,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    }
                }
            },
            orderBy: {
                createdAt: "desc", // Changed to desc for pagination (newest first)
            },
            take: 50, // Reduced from 100 for memory optimization
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
        });

        // Reverse to show oldest first in UI
        return NextResponse.json(messages.reverse());
    } catch (error) {
        console.error("[MESSAGES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    props: { params: Promise<{ channelId: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { content } = await req.json();

        if (!content?.trim()) {
            return new NextResponse("Message cannot be empty", { status: 400 });
        }

        const channel = await prisma.channel.findUnique({
            where: { id: params.channelId },
        });

        if (!channel) {
            return new NextResponse("Channel not found", { status: 404 });
        }

        // Permission check
        const membership = await prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId: channel.communityId,
                    userId: (session.user as any).id,
                },
            },
        });

        if (!membership) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const message = await prisma.message.create({
            data: {
                content,
                channelId: params.channelId,
                senderId: (session.user as any).id,
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

        await pusherServer.trigger(`chat-${params.channelId}`, "new-message", message);

        return NextResponse.json(message);

    } catch (error) {
        console.error("[MESSAGES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
