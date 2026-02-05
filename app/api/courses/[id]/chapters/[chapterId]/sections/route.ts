import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { verifyInstructorAccess } from '@/lib/courses/course-operations'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const params = await props.params
    const { chapterId } = params

    const sectionsList = await dbService.getPrisma().courseSection.findMany({
      where: { chapterId },
      include: {
        quiz: {
          include: {
            questions: true
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(sectionsList)
  } catch (error) {
    console.error('Failed to fetch sections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string; chapterId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const instructorId = (session.user as any).id
    const params = await props.params
    const { id: courseId, chapterId } = params
    
    const hasAccess = await verifyInstructorAccess(courseId, instructorId)
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const sectionData = await request.json()

    if (!sectionData.title || !sectionData.contentType) {
      return NextResponse.json(
        { error: 'Title and contentType are required' },
        { status: 400 }
      )
    }

    const maxOrderResult = await dbService.getPrisma().courseSection.aggregate({
      where: { chapterId },
      _max: { order: true }
    })

    const nextOrder = (maxOrderResult._max.order || 0) + 1

    const newSection = await dbService.getPrisma().courseSection.create({
      data: {
        chapterId,
        title: sectionData.title,
        contentType: sectionData.contentType,
        content: sectionData.content,
        videoUrl: sectionData.videoUrl,
        fileUrl: sectionData.fileUrl,
        fileName: sectionData.fileName,
        fileSize: sectionData.fileSize,
        filePath: sectionData.filePath,
        order: sectionData.order !== undefined ? sectionData.order : nextOrder
      }
    })

    return NextResponse.json(newSection, { status: 201 })
  } catch (error) {
    console.error('Failed to create section:', error)
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    )
  }
}
