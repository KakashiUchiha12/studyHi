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

    const announcementsList = await dbService.getPrisma().courseAnnouncement.findMany({
      where: { courseId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(announcementsList)
  } catch (error) {
    console.error('Failed to fetch announcements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
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
        { error: 'Only instructors can create announcements' },
        { status: 403 }
      )
    }

    const announcementData = await request.json()

    if (!announcementData.title || !announcementData.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const newAnnouncement = await dbService.getPrisma().courseAnnouncement.create({
      data: {
        courseId,
        title: announcementData.title,
        content: announcementData.content
      }
    })

    const enrolledStudents = await dbService.getPrisma().courseEnrollment.findMany({
      where: { courseId },
      select: { userId: true }
    })

    const notificationPromises = enrolledStudents.map(enrollment =>
      dbService.getPrisma().notification.create({
        data: {
          userId: enrollment.userId,
          type: 'course_announcement',
          title: `New Announcement: ${announcementData.title}`,
          message: announcementData.content.substring(0, 100),
          link: `/courses/${courseId}`
        }
      })
    )

    await Promise.all(notificationPromises)

    return NextResponse.json(newAnnouncement, { status: 201 })
  } catch (error) {
    console.error('Failed to create announcement:', error)
    return NextResponse.json(
      { error: 'Failed to create announcement' },
      { status: 500 }
    )
  }
}
