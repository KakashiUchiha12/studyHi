import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { markChapterAsComplete, retrieveEnrollmentByIdentifiers } from '@/lib/courses/progress-tracker'
import { checkCompletionBadge } from '@/lib/courses/achievement-manager'

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

    const studentId = (session.user as any).id
    const params = await props.params
    const { id: courseId, chapterId } = params

    const enrollmentRecord = await retrieveEnrollmentByIdentifiers(courseId, studentId)

    if (!enrollmentRecord) {
      return NextResponse.json(
        { error: 'Not enrolled in this course' },
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

    const progressRecord = await markChapterAsComplete(
      enrollmentRecord.id,
      chapterId,
      studentId
    )

    const updatedEnrollment = await dbService.getPrisma().courseEnrollment.findUnique({
      where: { id: enrollmentRecord.id }
    })

    if (updatedEnrollment?.completedAt) {
      await checkCompletionBadge(studentId, courseId)
    }

    return NextResponse.json(progressRecord)
  } catch (error) {
    console.error('Failed to mark chapter as complete:', error)
    return NextResponse.json(
      { error: 'Failed to mark chapter as complete' },
      { status: 500 }
    )
  }
}
