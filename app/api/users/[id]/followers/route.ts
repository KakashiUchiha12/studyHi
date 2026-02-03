import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const followers = await prisma.follows.findMany({
            where: { followingId: params.id },
            include: {
                follower: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            }
        });

        // Flatten structure for easier consumption
        const result = followers.map(f => f.follower);
        return NextResponse.json(result);
    } catch (error) {
        console.error("[FOLLOWERS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
