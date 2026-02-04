import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const followers = await prisma.follows.findMany({
            where: { followingId: params.id },
            include: {
                follower: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        username: true
                    }
                }
            }
        });

        return NextResponse.json(followers.map(f => f.follower));
    } catch (error) {
        console.error("[FOLLOWERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
