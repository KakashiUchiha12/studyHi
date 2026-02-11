import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string; userId: string }> }
) {
    const { id, userId } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { role } = await req.json(); // 'admin', 'moderator', 'member'

        // Check if requester is admin
        const requesterMembership = await prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId: id,
                    userId: (session.user as any).id
                }
            }
        });

        if (!requesterMembership || requesterMembership.role !== 'admin') {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Update target member logic
        // Prevent changing owner's role?
        const community = await prisma.community.findUnique({ where: { id } });
        if (community?.ownerId === userId) {
            return new NextResponse("Cannot change owner role", { status: 400 });
        }

        const updatedMember = await prisma.communityMember.update({
            where: {
                communityId_userId: {
                    communityId: id,
                    userId: userId
                }
            },
            data: { role }
        });

        return NextResponse.json(updatedMember);

    } catch (error) {
        console.error("[MEMBER_UPDATE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; userId: string }> }
) {
    const { id, userId } = await params;
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // Check if requester is admin
        const requesterMembership = await prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId: id,
                    userId: (session.user as any).id
                }
            }
        });

        if (!requesterMembership || requesterMembership.role !== 'admin') {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Prevent kicking owner
        const community = await prisma.community.findUnique({ where: { id } });
        if (community?.ownerId === userId) {
            return new NextResponse("Cannot kick owner", { status: 400 });
        }

        await prisma.communityMember.delete({
            where: {
                communityId_userId: {
                    communityId: id,
                    userId: userId
                }
            }
        });

        return new NextResponse(null, { status: 200 });

    } catch (error) {
        console.error("[MEMBER_KICK]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
