import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const following = await prisma.follows.findMany({
            where: { followerId: params.id },
            include: {
                following: {
                    select: {
                        id: true,
                        name: true,
                        image: true
                    }
                }
            }
        });

        // Flatten structure
        const result = following.map(f => f.following);
        return NextResponse.json(result);
    } catch (error) {
        console.error("[FOLLOWING_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
