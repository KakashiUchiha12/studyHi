import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    props: { params: Promise<{ channelId: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const channel = await prisma.channel.findUnique({
            where: { id: params.channelId },
            include: { community: true }
        });

        if (!channel) {
            return new NextResponse("Channel not found", { status: 404 });
        }

        // Check Permissions
        const membership = await prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId: channel.communityId,
                    userId: (session.user as any).id,
                },
            },
        });

        const isOwner = channel.community.ownerId === (session.user as any).id;
        const isAdmin = membership?.role === "admin";

        if (!isOwner && !isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.channel.delete({
            where: { id: params.channelId },
        });

        return new NextResponse(null, { status: 200 });

    } catch (error) {
        console.error("[CHANNEL_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: { channelId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { name } = await req.json();

        if (name === "general") {
            return new NextResponse("Cannot rename default channel", { status: 400 });
        }

        const channel = await prisma.channel.findUnique({
            where: { id: params.channelId },
            include: { community: true }
        });

        if (!channel) {
            return new NextResponse("Channel not found", { status: 404 });
        }

        // Check Permissions (Same as Delete)
        const membership = await prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId: channel.communityId,
                    userId: (session.user as any).id,
                },
            },
        });

        const isOwner = channel.community.ownerId === (session.user as any).id;
        const isAdmin = membership?.role === "admin";

        if (!isOwner && !isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const updatedChannel = await prisma.channel.update({
            where: { id: params.channelId },
            data: { name }
        });

        return NextResponse.json(updatedChannel);

    } catch (error) {
        console.error("[CHANNEL_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
