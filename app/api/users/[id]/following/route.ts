import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const following = await prisma.follows.findMany({
            where: { followerId: id },
            include: {
                following: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        username: true
                    }
                }
            }
        });

        return NextResponse.json(following.map(f => f.following));
    } catch (error) {
        console.error("[FOLLOWING_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
