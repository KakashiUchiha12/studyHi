import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isClassMember, canViewSubmissions } from '@/lib/classes/permissions'

/**
 * GET /api/classes/[id]/assignments/[assignmentId]/submissions/[submissionId]
 * Get a single submission
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string; submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const { id: classId, assignmentId, submissionId } = await params

    // Check if user is a member
    const isMember = await isClassMember(classId, userId)

    if (!isMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get submission
    const submission = await dbService.getPrisma().submission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        grader: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        assignment: {
          select: {
            classId: true,
          },
        },
      },
    })

    if (!submission || submission.assignmentId !== assignmentId) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    if (submission.assignment.classId !== classId) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }

    // Check permission - students can only see their own submissions
    const isTeacher = await canViewSubmissions(userId, classId)
    const isOwner = submission.studentId === userId

    if (!isTeacher && !isOwner) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Failed to fetch submission:', error)
    return NextResponse.json(
      { error: 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}
