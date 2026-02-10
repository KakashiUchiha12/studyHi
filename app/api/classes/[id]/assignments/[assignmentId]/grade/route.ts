import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isTeacherOrAdmin } from '@/lib/classes/permissions'

/**
 * POST /api/classes/[id]/assignments/[assignmentId]/grade
 * Grade a student's submission (teacher/admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; assignmentId: string }> }
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
    const { id: classId, assignmentId } = await params

    // Check if user is teacher or admin
    const hasPermission = await isTeacherOrAdmin(classId, userId)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    const { submissionId, grade, feedback } = await request.json()

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Submission ID is required' },
        { status: 400 }
      )
    }

    // Update submission
    const result = await dbService.getPrisma().submission.update({
      where: { id: submissionId },
      data: {
        grade: parseInt(grade),
        feedback,
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
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to grade submission:', error)
    return NextResponse.json(
      { error: 'Failed to grade submission' },
      { status: 500 }
    )
  }
}
