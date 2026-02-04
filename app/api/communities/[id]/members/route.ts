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

        const members = await prisma.communityMember.findMany({
            where: { communityId: id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    }
                }
            },
            take: 200, // Limit for memory optimization
            orderBy: [
                { role: 'asc' }, // admin < member alphabetically, usually 'admin' comes before 'member'
                { joinedAt: 'desc' }
            ]
        });

        // Custom sort to ensure Admin > Moderator > Member if strings differ
        const roleOrder: Record<string, number> = { 'admin': 0, 'moderator': 1, 'member': 2 };

        const sortedMembers = members.sort((a, b) => {
            const roleA = roleOrder[a.role] ?? 99;
            const roleB = roleOrder[b.role] ?? 99;
            return roleA - roleB;
        });

        return NextResponse.json(sortedMembers);
    } catch (error) {
        console.error("[COMMUNITY_MEMBERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
