import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { verifyInstructorAccess } from '@/lib/courses/course-operations'

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params
        const courseId = params.id

        const modulesList = await dbService.getPrisma().courseModule.findMany({
            where: { courseId },
            include: {
                chapters: {
                    include: {
                        sections: {
                            include: {
                                quiz: {
                                    include: {
                                        questions: {
                                            orderBy: { order: 'asc' }
                                        }
                                    }
                                }
                            },
                            orderBy: { order: 'asc' }
                        }
                    },
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { order: 'asc' }
        })

        return NextResponse.json(modulesList)
    } catch (error) {
        console.error('Failed to fetch content:', error)
        return NextResponse.json(
            { error: 'Failed to fetch content' },
            { status: 500 }
        )
    }
}

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params
    const courseId = params.id
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user || !(session.user as any).id) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        const instructorId = (session.user as any).id

        const hasAccess = await verifyInstructorAccess(courseId, instructorId)
        if (!hasAccess) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { modules } = await request.json()

        if (!Array.isArray(modules)) {
            return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
        }

        // Use transaction for atomic structure update
        await dbService.getPrisma().$transaction(async (tx) => {
            // 1. Delete existing structure for this course
            await tx.courseModule.deleteMany({
                where: { courseId }
            })

            // 2. Re-create modules, chapters, and sections
            for (const mData of modules) {
                await tx.courseModule.create({
                    data: {
                        courseId,
                        title: mData.title,
                        description: mData.description,
                        order: mData.order,
                        moduleImage: mData.moduleImage,
                        chapters: {
                            create: mData.chapters.map((cData: any) => ({
                                title: cData.title,
                                description: cData.description,
                                order: cData.order,
                                sections: {
                                    create: cData.sections.map((sData: any) => ({
                                        title: sData.title,
                                        contentType: sData.sectionType || 'video',
                                        content: sData.content,
                                        videoUrl: sData.videoUrl,
                                        imageUrl: sData.imageUrl,
                                        images: sData.images ? (Array.isArray(sData.images) ? JSON.stringify(sData.images) : sData.images) : null,
                                        attachments: sData.attachments ? (Array.isArray(sData.attachments) ? JSON.stringify(sData.attachments) : sData.attachments) : null,
                                        order: sData.order,
                                        duration: sData.duration,
                                        sectionType: sData.sectionType,
                                        quiz: sData.quiz ? {
                                            create: {
                                                title: sData.quiz.title || sData.title,
                                                description: sData.quiz.description,
                                                passingScore: sData.quiz.passingScore || 70,
                                                questions: {
                                                    create: sData.quiz.questions.map((q: any, qIdx: number) => ({
                                                        question: q.question,
                                                        questionType: q.questionType || 'single',
                                                        options: typeof q.options === 'string' ? q.options : JSON.stringify(q.options),
                                                        correctAnswers: typeof q.correctAnswers === 'string' ? q.correctAnswers : JSON.stringify(q.correctAnswers),
                                                        explanation: q.explanation,
                                                        order: q.order !== undefined ? q.order : qIdx
                                                    }))
                                                }
                                            }
                                        } : undefined
                                    }))
                                }
                            }))
                        }
                    }
                })
            }
        }, {
            maxWait: 10000,
            timeout: 30000
        })

        // Fetch the final structure after transaction to return to client
        const updatedModules = await dbService.getPrisma().courseModule.findMany({
            where: { courseId },
            include: {
                chapters: {
                    include: {
                        sections: {
                            include: {
                                quiz: {
                                    include: {
                                        questions: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { order: 'asc' }
        })

        return NextResponse.json({ success: true, modules: updatedModules })
    } catch (error: any) {
        const fs = require('fs');
        fs.writeFileSync('d:\\Development_3rd_Feb\\course-content-error.json', JSON.stringify({
            message: error.message,
            stack: error.stack,
            name: error.constructor.name,
            courseId
        }, null, 2));
        console.error('Failed to save course content:', error)
        return NextResponse.json(
            { error: 'Failed to save course content', details: error.message },
            { status: 500 }
        )
    }
}
