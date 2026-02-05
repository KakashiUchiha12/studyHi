import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyInstructorAccess } from '@/lib/courses/course-operations'
import { fetchEnrolledStudentsList } from '@/lib/courses/progress-tracker'

export async function GET(
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
        { error: 'Only instructors can view student list' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    
    const skip = (page - 1) * pageSize

    const result = await fetchEnrolledStudentsList(courseId, { skip, take: pageSize })

    return NextResponse.json({
      students: result.students,
      total: result.total,
      currentPage: page,
      totalPages: Math.ceil(result.total / pageSize)
    })
  } catch (error) {
    console.error('Failed to fetch students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}
