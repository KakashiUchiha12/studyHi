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
                    OR: [
                        { name: { contains: query } },
                        { id: { contains: query } } // Allow searching by ID
                    ],
                    isPrivate: false,
                    showInSearch: true // Only show if allowed
                } as any,
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
                    showInSearch: true // Only show if allowed
                } as any, // Cast to any to avoid type error if client is stale
                include: {
                    _count: {
                        select: { members: true },
                    },
                    members: session?.user ? {
                        where: { userId: (session.user as any).id },
                        select: { role: true }
                    } : false
                },
                take: 20,
                orderBy: {
                    createdAt: 'desc'
                }
            });
        }

        return NextResponse.json(communities, {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
            }
        });
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

        const { name, description, isPrivate, showInSearch, coverImage, icon, rules } = await req.json();

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

        console.log("[COMMUNITIES_POST] Creating community for user:", user.id);

        const community = await prisma.community.create({
            data: {
                name,
                description,
                isPrivate,
                showInSearch: showInSearch !== undefined ? showInSearch : true,
                coverImage,
                icon,
                rules,
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
            } as any
        });

        console.log("[COMMUNITIES_POST] Success:", community.id);
        return NextResponse.json(community);
    } catch (error: any) {
        console.error("[COMMUNITIES_POST] Error type:", typeof error);
        console.error("[COMMUNITIES_POST] Complete Error:", error);
        if (error.message) console.error("[COMMUNITIES_POST] Message:", error.message);
        if (error.code) console.error("[COMMUNITIES_POST] Code:", error.code);
        return new NextResponse("Internal Error: " + (error.message || "Unknown"), { status: 500 });
    }
}
