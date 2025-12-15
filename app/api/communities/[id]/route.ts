import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
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
