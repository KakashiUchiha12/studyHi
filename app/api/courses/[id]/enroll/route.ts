import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { registerStudentEnrollment } from '@/lib/courses/progress-tracker'
import { checkEnrollmentBadge } from '@/lib/courses/achievement-manager'
import { dbService } from '@/lib/database'
import { updateCourseStatistics } from '@/lib/courses/course-operations'

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

    const studentId = (session.user as any).id
    const params = await props.params
    const courseId = params.id

    const courseRecord = await dbService.getPrisma().course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!courseRecord) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    const enrollment = await registerStudentEnrollment(courseId, studentId)
    await updateCourseStatistics(courseId)

    await checkEnrollmentBadge(studentId, courseId)

    await dbService.getPrisma().notification.create({
      data: {
        userId: studentId,
        type: 'course_enrollment',
        title: 'Course Enrollment',
        message: `You have successfully enrolled in ${courseRecord.title}`,
        actionUrl: `/courses/${courseId}`
      }
    })

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      )
    }

    console.error('Failed to enroll in course:', error)
    return NextResponse.json(
      { error: 'Failed to enroll in course' },
      { status: 500 }
    )
  }
}
