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
            sections: true
          },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(modulesList)
  } catch (error) {
    console.error('Failed to fetch modules:', error)
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
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
    const courseId = params.id
    
    const hasAccess = await verifyInstructorAccess(courseId, instructorId)
    
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const moduleData = await request.json()

    if (!moduleData.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const maxOrderResult = await dbService.getPrisma().courseModule.aggregate({
      where: { courseId },
      _max: { order: true }
    })

    const nextOrder = (maxOrderResult._max.order || 0) + 1

    const newModule = await dbService.getPrisma().courseModule.create({
      data: {
        courseId,
        title: moduleData.title,
        description: moduleData.description,
        order: moduleData.order !== undefined ? moduleData.order : nextOrder
      }
    })

    return NextResponse.json(newModule, { status: 201 })
  } catch (error) {
    console.error('Failed to create module:', error)
    return NextResponse.json(
      { error: 'Failed to create module' },
      { status: 500 }
    )
  }
}
