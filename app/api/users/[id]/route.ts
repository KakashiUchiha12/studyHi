import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id: userId } = await params;
        const currentUserId = (session?.user as any)?.id;

        if (!userId) {
            return new NextResponse("User ID required", { status: 400 });
        }

        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { id: userId },
                    { username: userId }
                ]
            },
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                createdAt: true,
                socialProfile: {
                    select: {
                        bio: true,
                        website: true,
                        websiteLabel: true,
                        websiteUrl2: true,
                        websiteLabel2: true,
                        githubUrl: true,
                        linkedinUrl: true,
                        twitterUrl: true,
                        instagramUrl: true,
                        instagramLabel: true,
                        youtubeUrl: true,
                        youtubeLabel: true,
                        whatsappUrl: true,
                        whatsappLabel: true,
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
            console.log(`[USER_GET] User not found: ${userId}`);
            return new NextResponse("User not found", { status: 404 });
        }

        let isFollowing = false;
        if (currentUserId && currentUserId !== user.id) {
            const follow = await prisma.follows.findUnique({
                where: {
                    followerId_followingId: {
                        followerId: currentUserId,
                        followingId: user.id
                    }
                }
            });
            isFollowing = !!follow;
        }

        return NextResponse.json({
            ...user,
            isFollowing
        });
    } catch (error) {
        console.error("[USER_GET] Error fetching user:", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
