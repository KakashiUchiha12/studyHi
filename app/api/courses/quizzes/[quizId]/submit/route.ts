import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { processQuizSubmission } from '@/lib/courses/quiz-handler'
import { retrieveEnrollmentByIdentifiers } from '@/lib/courses/progress-tracker'
import { evaluateBadgeEligibility } from '@/lib/courses/achievement-manager'
import { dbService } from '@/lib/database'

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ quizId: string }> }
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
    const quizId = params.quizId
    const submissionData = await request.json()

    const quizRecord = await dbService.getPrisma().quiz.findUnique({
      where: { id: quizId },
      include: {
        section: {
          include: {
            chapter: {
              include: {
                module: {
                  include: {
                    course: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!quizRecord) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    const courseId = quizRecord.section.chapter.module.course.id
    const enrollmentRecord = await retrieveEnrollmentByIdentifiers(courseId, studentId)

    if (!enrollmentRecord) {
      return NextResponse.json(
        { error: 'Must be enrolled in the course to submit quiz' },
        { status: 403 }
      )
    }

    if (!submissionData.answers || typeof submissionData.answers !== 'object') {
      return NextResponse.json(
        { error: 'Invalid submission format' },
        { status: 400 }
      )
    }

    const result = await processQuizSubmission(
      quizId,
      studentId,
      submissionData.answers,
      submissionData.timeTaken
    )

    await evaluateBadgeEligibility(studentId, courseId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to submit quiz:', error)
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
      { status: 500 }
    )
  }
}
