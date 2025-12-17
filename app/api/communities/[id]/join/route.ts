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
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = (session.user as any).id;
        const communityId = params.id;

        const existingMember = await prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId,
                    userId
                }
            }
        });

        if (existingMember) {
            return new NextResponse("Already a member", { status: 400 });
        }

        await prisma.communityMember.create({
            data: {
                communityId,
                userId,
                role: "member"
            }
        });

        return NextResponse.json({ joined: true });
    } catch (error) {
        console.error("[COMMUNITY_JOIN]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userId = (session.user as any).id;
        const communityId = params.id;

        // Check if admin/owner
        const membership = await prisma.communityMember.findUnique({
            where: {
                communityId_userId: {
                    communityId,
                    userId
                }
            }
        });

        if (!membership) {
            return new NextResponse("Not a member", { status: 400 });
        }

        // Prevent owner from leaving without transferring ownership (simplified: just allow leaving for now, maybe warn in UI)
        // If strict: check if user is owner of community.
        const community = await prisma.community.findUnique({ where: { id: communityId } });
        if (community?.ownerId === userId) {
            return new NextResponse("Owner cannot leave. Delete community instead.", { status: 400 });
        }

        await prisma.communityMember.delete({
            where: {
                communityId_userId: {
                    communityId,
                    userId
                }
            }
        });

        return NextResponse.json({ joined: false });
    } catch (error) {
        console.error("[COMMUNITY_LEAVE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
