import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!currentUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        if (currentUser.id === id) {
            return new NextResponse("Cannot follow yourself", { status: 400 });
        }

        const follow = await prisma.follows.upsert({
            where: {
                followerId_followingId: {
                    followerId: currentUser.id,
                    followingId: id
                }
            },
            update: {},
            create: {
                followerId: currentUser.id,
                followingId: id
            }
        });

        // Trigger notification for the followed user
        if (follow) {
            const { createNotification } = await import("@/lib/notifications-server");
            await createNotification({
                userId: id,
                senderId: currentUser.id,
                type: "follow",
                title: "New Follower",
                message: `${session.user.name} started following you!`,
                actionUrl: `/profile/${currentUser.id}`
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[FOLLOW_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        });

        if (!currentUser) {
            return new NextResponse("User not found", { status: 404 });
        }

        await prisma.follows.delete({
            where: {
                followerId_followingId: {
                    followerId: currentUser.id,
                    followingId: id
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[FOLLOW_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
