import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  retrieveCourseDetails,
  modifyCourseData,
  removeCourse,
  verifyInstructorAccess
} from '@/lib/courses/course-operations'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const courseId = params.id

    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    // Increment view count (async)
    prisma.course.update({
      where: { id: courseId },
      data: { viewCount: { increment: 1 } }
    }).catch(err => console.error("Course view increment failed:", err))

    const courseDetails = await retrieveCourseDetails(courseId, userId)

    if (!courseDetails) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    if (courseDetails.isDraft && courseDetails.userId !== userId) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(courseDetails)
  } catch (error) {
    console.error('Failed to fetch course:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
        { error: 'Unauthorized to modify this course' },
        { status: 403 }
      )
    }

    const updateData = await request.json()
    const updatedCourse = await modifyCourseData(courseId, updateData)

    return NextResponse.json(updatedCourse)
  } catch (error) {
    console.error('Failed to update course:', error)
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
        { error: 'Unauthorized to delete this course' },
        { status: 403 }
      )
    }

    await removeCourse(courseId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete course:', error)
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    )
  }
}
