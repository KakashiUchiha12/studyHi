import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { verifyInstructorAccess } from '@/lib/courses/course-operations'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    const params = await props.params
    const { moduleId } = params

    const chaptersList = await dbService.getPrisma().courseChapter.findMany({
      where: { moduleId },
      include: {
        sections: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(chaptersList)
  } catch (error) {
    console.error('Failed to fetch chapters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chapters' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string; moduleId: string }> }
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
    const { id: courseId, moduleId } = params
    
    const hasAccess = await verifyInstructorAccess(courseId, instructorId)
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const chapterData = await request.json()

    if (!chapterData.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const maxOrderResult = await dbService.getPrisma().courseChapter.aggregate({
      where: { moduleId },
      _max: { order: true }
    })

    const nextOrder = (maxOrderResult._max.order || 0) + 1

    const newChapter = await dbService.getPrisma().courseChapter.create({
      data: {
        moduleId,
        title: chapterData.title,
        description: chapterData.description,
        isFree: chapterData.isFree || false,
        order: chapterData.order !== undefined ? chapterData.order : nextOrder
      }
    })

    return NextResponse.json(newChapter, { status: 201 })
  } catch (error) {
    console.error('Failed to create chapter:', error)
    return NextResponse.json(
      { error: 'Failed to create chapter' },
      { status: 500 }
    )
  }
}
