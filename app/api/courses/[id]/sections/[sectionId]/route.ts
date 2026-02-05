import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { verifyInstructorAccess } from '@/lib/courses/course-operations'

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string; sectionId: string }> }
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
    const { id: courseId, sectionId } = params
    
    const hasAccess = await verifyInstructorAccess(courseId, instructorId)
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const sectionRecord = await dbService.getPrisma().courseSection.findFirst({
      where: {
        id: sectionId,
        chapter: {
          module: {
            courseId
          }
        }
      }
    })

    if (!sectionRecord) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    const updateData = await request.json()
    
    const updatedSection = await dbService.getPrisma().courseSection.update({
      where: { id: sectionId },
      data: {
        title: updateData.title,
        contentType: updateData.contentType,
        content: updateData.content,
        videoUrl: updateData.videoUrl,
        fileUrl: updateData.fileUrl,
        fileName: updateData.fileName,
        fileSize: updateData.fileSize,
        filePath: updateData.filePath,
        order: updateData.order
      }
    })

    return NextResponse.json(updatedSection)
  } catch (error) {
    console.error('Failed to update section:', error)
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string; sectionId: string }> }
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
    const { id: courseId, sectionId } = params
    
    const hasAccess = await verifyInstructorAccess(courseId, instructorId)
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const sectionRecord = await dbService.getPrisma().courseSection.findFirst({
      where: {
        id: sectionId,
        chapter: {
          module: {
            courseId
          }
        }
      }
    })

    if (!sectionRecord) {
      return NextResponse.json(
        { error: 'Section not found' },
        { status: 404 }
      )
    }

    await dbService.getPrisma().courseSection.delete({
      where: { id: sectionId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete section:', error)
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    )
  }
}
