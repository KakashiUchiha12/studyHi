import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Assuming auth options are here
import { prisma } from "@/lib/prisma"; // Assuming prisma client is here

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("query");

        let communities;

        if (query) {
            communities = await prisma.community.findMany({
                where: {
                    name: {
                        contains: query,
                        // mode: "insensitive", // SQLite doesn't support insensitive mode easily, removed for compatibility
                    },
                    isPrivate: false,
                },
                include: {
                    _count: {
                        select: { members: true },
                    },
                },
                take: 20,
            });
        } else {
            communities = await prisma.community.findMany({
                where: {
                    isPrivate: false,
                },
                include: {
                    _count: {
                        select: { members: true },
                    },
                },
                take: 20,
                orderBy: {
                    members: {
                        _count: 'desc'
                    }
                }
            });
        }

        return NextResponse.json(communities);
    } catch (error) {
        console.error("[COMMUNITIES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { name, description, isPrivate } = await req.json();

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        // Get user from DB to use ID
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user) {
            return new NextResponse("User not found", { status: 404 });
        }

        const existingCommunity = await prisma.community.findUnique({
            where: { name }
        });

        if (existingCommunity) {
            return new NextResponse("Community already exists", { status: 409 });
        }

        const community = await prisma.community.create({
            data: {
                name,
                description,
                isPrivate,
                ownerId: user.id,
                members: {
                    create: {
                        userId: user.id,
                        role: "admin"
                    }
                },
                channels: {
                    create: [
                        { name: "general", type: "text" },
                        { name: "announcements", type: "announcement" }
                    ]
                }
            }
        });

        return NextResponse.json(community);
    } catch (error) {
        console.error("[COMMUNITIES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
