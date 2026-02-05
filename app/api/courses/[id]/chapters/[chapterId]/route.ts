import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { verifyInstructorAccess } from '@/lib/courses/course-operations'

export async function PUT(
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

    const chapterRecord = await dbService.getPrisma().courseChapter.findFirst({
      where: {
        id: chapterId,
        module: {
          courseId
        }
      }
    })

    if (!chapterRecord) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    const updateData = await request.json()
    
    const updatedChapter = await dbService.getPrisma().courseChapter.update({
      where: { id: chapterId },
      data: {
        title: updateData.title,
        description: updateData.description,
        isFree: updateData.isFree,
        order: updateData.order
      }
    })

    return NextResponse.json(updatedChapter)
  } catch (error) {
    console.error('Failed to update chapter:', error)
    return NextResponse.json(
      { error: 'Failed to update chapter' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const chapterRecord = await dbService.getPrisma().courseChapter.findFirst({
      where: {
        id: chapterId,
        module: {
          courseId
        }
      }
    })

    if (!chapterRecord) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    await dbService.getPrisma().courseChapter.delete({
      where: { id: chapterId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete chapter:', error)
    return NextResponse.json(
      { error: 'Failed to delete chapter' },
      { status: 500 }
    )
  }
}
