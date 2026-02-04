import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = params; // Target user ID

        // Should configure user to not follow themselves
        if (id === (session.user as any).id) {
            return new NextResponse("Cannot follow yourself", { status: 400 });
        }

        await prisma.follows.create({
            data: {
                followerId: (session.user as any).id,
                followingId: id
            }
        });

        return NextResponse.json({ success: true, following: true });
    } catch (error) {
        console.error("[FOLLOW_POST]", error);
        // Handle unique constraint violation (already following)
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ success: true, following: true });
        }
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

        const { id } = params; // Target user ID

        await prisma.follows.deleteMany({
            where: {
                followerId: (session.user as any).id,
                followingId: id
            }
        });

        return NextResponse.json({ success: true, following: false });
    } catch (error) {
        console.error("[FOLLOW_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
