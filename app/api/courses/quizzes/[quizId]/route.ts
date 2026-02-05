import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { retrieveQuizWithRandomization } from '@/lib/courses/quiz-handler'
import { retrieveEnrollmentByIdentifiers } from '@/lib/courses/progress-tracker'

export async function GET(
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

    const quizData = await retrieveQuizWithRandomization(quizId)

    if (!quizData) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      )
    }

    const enrollmentRecord = await retrieveEnrollmentByIdentifiers(quizData.courseId, studentId)

    if (!enrollmentRecord) {
      return NextResponse.json(
        { error: 'Must be enrolled in the course to access quiz' },
        { status: 403 }
      )
    }

    const questionsWithoutAnswers = quizData.questions.map(q => ({
      id: q.id,
      question: q.question,
      questionType: q.questionType,
      options: q.options,
      questionPosition: q.questionPosition
    }))

    return NextResponse.json({
      id: quizData.id,
      title: quizData.title,
      description: quizData.description,
      passingScore: quizData.passingScore,
      timeLimit: quizData.timeLimit,
      questions: questionsWithoutAnswers
    })
  } catch (error) {
    console.error('Failed to fetch quiz:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    )
  }
}
