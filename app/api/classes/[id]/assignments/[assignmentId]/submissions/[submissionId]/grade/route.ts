import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isTeacherOrAdmin } from '@/lib/classes/permissions'

/**
 * PUT /api/classes/[id]/assignments/[assignmentId]/submissions/[submissionId]/grade
 * Grade a submission (teacher/admin only)
 */
export async function PUT(
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

    // Check if user is teacher or admin
    const hasPermission = await isTeacherOrAdmin(classId, userId)
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Get submission and verify it belongs to the assignment and class
    const submission = await dbService.getPrisma().submission.findUnique({
      where: { id: submissionId },
      include: {
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

    const body = await request.json()

    // Validate grade
    if (body.grade !== undefined && body.grade !== null) {
      if (typeof body.grade !== 'number' || body.grade < 0 || body.grade > 100) {
        return NextResponse.json(
          { error: 'Grade must be a number between 0 and 100' },
          { status: 400 }
        )
      }
    }

    // Update submission with grade and feedback
    const updatedSubmission = await dbService.getPrisma().submission.update({
      where: { id: submissionId },
      data: {
        grade: body.grade,
        feedback: body.feedback,
        gradedAt: new Date(),
        gradedBy: userId,
      },
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
      },
    })

    return NextResponse.json(updatedSubmission)
  } catch (error) {
    console.error('Failed to grade submission:', error)
    return NextResponse.json(
      { error: 'Failed to grade submission' },
      { status: 500 }
    )
  }
}
