import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        const events = await (prisma as any).communityEvent.findMany({
            where: {
                communityId: params.id,
                endDate: {
                    gte: new Date() // Only future or ongoing events
                }
            },
            include: {
                creator: {
                    select: {
                        name: true,
                        image: true
                    }
                },
                _count: {
                    select: {
                        attendees: true
                    }
                },
                // Only fetch current user's attendance status, not all attendees
                attendees: userId ? {
                    where: {
                        userId: userId
                    },
                    select: {
                        userId: true,
                        status: true
                    }
                } : false
            },
            orderBy: {
                startDate: 'asc'
            },
            take: 50 // Limit for memory optimization
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error("[EVENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if user is member of community
        // In real app, check for admin/moderator role
        const member = await prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId: params.id,
                    userId: userId
                }
            }
        });

        if (!member) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { title, description, startDate, endDate, location, coverImage } = await req.json();

        if (!title || !startDate) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const event = await (prisma as any).communityEvent.create({
            data: {
                communityId: params.id,
                creatorId: userId,
                title,
                description,
                startDate: new Date(startDate),
                endDate: endDate ? new Date(endDate) : null,
                location,
                coverImage
            }
        });

        return NextResponse.json(event);
    } catch (error) {
        console.error("[KEY_EVENTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
