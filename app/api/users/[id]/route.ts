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
        const userId = params.id;

        if (!userId) {
            return new NextResponse("User ID required", { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                image: true,
                createdAt: true,
                socialProfile: {
                    select: {
                        bio: true,
                        website: true,
                        location: true,
                        banner: true,
                    },
                },
                _count: {
                    select: {
                        posts: true,
                        followers: true,
                        following: true,
                    },
                },
            },
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        let isFollowing = false;
        if (session?.user?.email) {
            const currentUser = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true }
            });

            if (currentUser) {
                const follow = await prisma.follows.findUnique({
                    where: {
                        followerId_followingId: {
                            followerId: currentUser.id,
                            followingId: user.id
                        }
                    }
                });
                isFollowing = !!follow;
            }
        }

        return NextResponse.json({
            ...user,
            isFollowing
        });
    } catch (error) {
        console.error("[USER_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
