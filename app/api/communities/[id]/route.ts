import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = params;

        const community = await prisma.community.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { members: true, posts: true },
                },
                channels: true,
                members: {
                    where: {
                        userId: (await prisma.user.findUnique({ where: { email: session.user?.email! } }))?.id
                    }
                }
            },
        });

        if (!community) {
            return new NextResponse("Community not found", { status: 404 });
        }

        return NextResponse.json(community);
    } catch (error) {
        console.error("[COMMUNITY_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = params;
        const { name, description, isPrivate, showInSearch, coverImage, icon, rules } = await req.json();

        const userId = (session.user as any).id;

        // Check if user is admin of the community
        const membership = await prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId: id,
                    userId: userId
                }
            }
        });

        if (!membership || membership.role !== "admin") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const community = await prisma.community.update({
            where: { id },
            data: {
                name,
                description,
                isPrivate,
                showInSearch,
                coverImage,
                icon,
                rules
            } as any
        });

        return NextResponse.json(community);
    } catch (error) {
        console.error("[COMMUNITY_PUT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = params;
        const userId = (session.user as any).id;

        const community = await prisma.community.findUnique({
            where: { id }
        });

        if (!community) {
            return new NextResponse("Not found", { status: 404 });
        }

        // Only owner can delete (or super admin, but let's stick to owner for now)
        if (community.ownerId !== userId) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.community.delete({
            where: { id }
        });

        return new NextResponse(null, { status: 200 });
    } catch (error) {
        console.error("[COMMUNITY_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
