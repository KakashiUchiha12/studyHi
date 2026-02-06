import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma as db } from "@/lib/prisma";

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const params = await props.params;
        const courseId = params.id;
        const body = await req.json();
        const { modules } = body;

        if (!modules || !Array.isArray(modules)) {
            return new NextResponse("Invalid data format", { status: 400 });
        }

        // Verify course ownership
        const course = await db.course.findUnique({
            where: { id: courseId, userId: session.user.id }
        });

        if (!course) {
            return new NextResponse("Course not found or unauthorized", { status: 404 });
        }

        // Get current max order for modules to append new ones
        const lastModule = await db.courseModule.findFirst({
            where: { courseId },
            orderBy: { order: 'desc' }
        });
        let nextModuleOrder = (lastModule?.order ?? 0) + 1;

        // Use transaction for bulk creation
        const result = await db.$transaction(async (tx) => {
            let createdCount = 0;

            for (const mod of modules) {
                // Create Module
                const newModule = await tx.courseModule.create({
                    data: {
                        courseId,
                        title: mod.title,
                        order: nextModuleOrder++,
                    }
                });

                let nextChapterOrder = 1;
                for (const chap of mod.chapters) {
                    // Create Chapter
                    const newChapter = await tx.courseChapter.create({
                        data: {
                            moduleId: newModule.id,
                            title: chap.title,
                            order: nextChapterOrder++,
                        }
                    });

                    let nextLessonOrder = 1;
                    for (const lesson of chap.lessons) {
                        // Create Section (Lesson)
                        await tx.courseSection.create({
                            data: {
                                chapterId: newChapter.id,
                                title: lesson.title,
                                order: nextLessonOrder++,
                                content: lesson.description || "", // Map description to content
                                contentType: lesson.contentType || "video",
                                videoUrl: (() => {
                                    if (lesson.videoUrl) console.log("Importing Lesson Video URL:", lesson.videoUrl);
                                    return lesson.videoUrl || null;
                                })(),
                                imageUrl: lesson.imageUrl || null,
                                isPreview: false, // Default to not preview
                            }
                        });
                        createdCount++;
                    }
                }
            }
            return createdCount;
        });

        return NextResponse.json({ success: true, count: result });

    } catch (error) {
        console.error("[COURSE_IMPORT]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
