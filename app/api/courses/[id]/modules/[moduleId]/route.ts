import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { verifyInstructorAccess } from '@/lib/courses/course-operations'

export async function PUT(
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

    const moduleRecord = await dbService.getPrisma().courseModule.findFirst({
      where: {
        id: moduleId,
        courseId
      }
    })

    if (!moduleRecord) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      )
    }

    const updateData = await request.json()
    
    const updatedModule = await dbService.getPrisma().courseModule.update({
      where: { id: moduleId },
      data: {
        title: updateData.title,
        description: updateData.description,
        order: updateData.order
      }
    })

    return NextResponse.json(updatedModule)
  } catch (error) {
    console.error('Failed to update module:', error)
    return NextResponse.json(
      { error: 'Failed to update module' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    const moduleRecord = await dbService.getPrisma().courseModule.findFirst({
      where: {
        id: moduleId,
        courseId
      }
    })

    if (!moduleRecord) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      )
    }

    await dbService.getPrisma().courseModule.delete({
      where: { id: moduleId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete module:', error)
    return NextResponse.json(
      { error: 'Failed to delete module' },
      { status: 500 }
    )
  }
}
