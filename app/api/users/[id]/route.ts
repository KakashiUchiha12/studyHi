import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        const profile = await prisma.user.findUnique({
            where: { id: params.id },
            include: {
                socialProfile: true,
                _count: {
                    select: { followers: true, following: true, posts: true }
                }
            }
        });

        if (!profile) {
            return new NextResponse("User not found", { status: 404 });
        }

        let isFollowing = false;
        if (userId) {
            const follow = await prisma.follows.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: userId,
                        followingId: params.id
                    }
                }
            });
            isFollowing = !!follow;
        }

        return NextResponse.json({ ...profile, isFollowing });
    } catch (error) {
        console.error("[USER_PROFILE_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
