import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { name, type } = await req.json();

        // Check permission (Owner or Admin)
        const membership = await prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId: params.id,
                    userId: (session.user as any).id,
                },
            },
        });

        if (!membership || !["admin", "moderator"].includes(membership.role)) {
            // Note: Currently restricting channel creation to admins/mods. 
            // Owner is implicitly an admin usually, but we check role.
            // If owner record is separate, we might need to check community owner too, 
            // but usually owner has an admin member record.

            // Double check strict owner if admin role isn't enough
            const community = await prisma.community.findUnique({
                where: { id: params.id },
                select: { ownerId: true }
            });

            if (community?.ownerId !== (session.user as any).id && membership?.role !== "admin") {
                return new NextResponse("Forbidden", { status: 403 });
            }
        }

        const channel = await prisma.channel.create({
            data: {
                name,
                type: type || "text",
                communityId: params.id,
            },
        });

        return NextResponse.json(channel);
    } catch (error) {
        console.error("[CHANNELS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const channels = await prisma.channel.findMany({
            where: {
                communityId: params.id,
            },
            orderBy: {
                createdAt: "asc",
            },
            take: 100 // Limit for memory optimization (most communities won't have 100+ channels)
        });

        return NextResponse.json(channels, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
            }
        });
    } catch (error) {
        console.error("[CHANNELS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
