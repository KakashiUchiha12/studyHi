import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { dbService } from "@/lib/database/database-service";

const prisma = dbService.getPrisma();

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q") || "";
        const type = searchParams.get("type") || "all";
        const limit = parseInt(searchParams.get("limit") || "20");

        console.log(`🔍 Global Search: [${type}] query="${query}"`);

        if (!query.trim() && type === "all") {
            return NextResponse.json({
                users: [],
                posts: [],
                documents: [],
                subjects: []
            });
        }

        const results: any = {
            users: [],
            posts: [],
            documents: [],
            subjects: []
        };

        const searchQueries: any[] = [];

        // 1. Search Users
        if (type === "all" || type === "users") {
            searchQueries.push(
                prisma.user.findMany({
                    where: {
                        OR: [
                            { name: { contains: query } },
                            { username: { contains: query } }
                        ]
                    },
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        image: true,
                        socialProfile: {
                            select: { bio: true }
                        }
                    },
                    take: limit
                }).then(users => (results.users = users))
            );
        }

        // 2. Search Posts
        if (type === "all" || type === "posts") {
            searchQueries.push(
                prisma.post.findMany({
                    where: {
                        content: { contains: query }
                    },
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        user: {
                            select: { name: true, image: true, id: true }
                        },
                        _count: {
                            select: { comments: true, likes: true }
                        }
                    },
                    orderBy: { createdAt: "desc" },
                    take: limit
                }).then(posts => (results.posts = posts))
            );
        }

        // 3. Search Documents (Public or Owned)
        if (type === "all" || type === "documents") {
            const userId = (session.user as any).id;
            searchQueries.push(
                Promise.all([
                    prisma.driveFile.findMany({
                        where: {
                            originalName: { contains: query },
                            deletedAt: null,
                            OR: [
                                { isPublic: true },
                                { drive: { userId: userId } }
                            ]
                        },
                        select: {
                            id: true,
                            originalName: true,
                            fileType: true,
                            fileSize: true,
                            createdAt: true,
                            isPublic: true,
                            drive: {
                                select: { user: { select: { name: true, id: true } } }
                            }
                        },
                        take: limit
                    }),
                    prisma.subjectFile.findMany({
                        where: {
                            originalName: { contains: query },
                            OR: [
                                { isPublic: true },
                                { userId: userId }
                            ]
                        },
                        select: {
                            id: true,
                            originalName: true,
                            fileType: true,
                            fileSize: true,
                            createdAt: true,
                            isPublic: true,
                            user: {
                                select: { name: true, id: true }
                            }
                        },
                        take: limit
                    }),
                    prisma.attachment.findMany({
                        where: {
                            OR: [
                                { name: { contains: query } },
                                { url: { contains: query } }
                            ]
                        },
                        select: {
                            id: true,
                            name: true,
                            type: true,
                            postId: true,
                            createdAt: true,
                            post: {
                                select: {
                                    user: { select: { name: true, id: true } }
                                }
                            }
                        },
                        take: limit
                    })
                ]).then(([driveFiles, subjectFiles, attachments]) => {
                    const combined = [
                        ...driveFiles.map((f: any) => ({
                            ...f,
                            source: 'drive',
                            fileSize: f.fileSize.toString(),
                            user: f.drive?.user
                        })),
                        ...subjectFiles.map((f: any) => ({
                            ...f,
                            source: 'subject',
                            fileSize: f.fileSize.toString()
                        })),
                        ...attachments.map((a: any) => ({
                            id: a.id,
                            originalName: a.name || 'Attachment',
                            fileType: a.type,
                            createdAt: a.createdAt,
                            postId: a.postId,
                            user: a.post?.user,
                            source: 'attachment'
                        }))
                    ];
                    // Sorting to prioritize those with postId
                    combined.sort((a, b) => {
                        if (a.postId && !b.postId) return -1;
                        if (!a.postId && b.postId) return 1;
                        return 0;
                    });

                    // Basic deduplication
                    const seen = new Set();
                    results.documents = combined.filter(d => {
                        // Key by name and size to catch duplicates across sources
                        const key = `${d.originalName}-${d.fileSize || d.id}`;
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    }).slice(0, limit);
                })
            );
        }

        // 4. Search Subjects
        if (type === "all" || type === "subjects") {
            searchQueries.push(
                prisma.subject.findMany({
                    where: {
                        OR: [
                            { name: { contains: query } },
                            { code: { contains: query } },
                            { description: { contains: query } }
                        ]
                    },
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        color: true,
                        description: true,
                        user: { select: { name: true, id: true } }
                    },
                    take: limit
                }).then(subjects => (results.subjects = subjects))
            );
        }

        await Promise.all(searchQueries);

        console.log(`✅ Global Search: Found ${results.users.length} users, ${results.posts.length} posts, ${results.documents.length} docs, ${results.subjects.length} subjects`);

        return NextResponse.json(results);
    } catch (error) {
        console.error("[SEARCH_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
