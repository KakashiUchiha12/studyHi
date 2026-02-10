import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { getUserClassRole } from '@/lib/classes/permissions'

/**
 * POST /api/classes/[id]/assignments/[assignmentId]/submit
 * Submit an assignment (student only)
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

    // Check if user is a member of the class
    const userRole = await getUserClassRole(classId, userId)

    if (!userRole) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Students, admins, and teachers can all submit assignments
    if (!['student', 'admin', 'teacher'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Invalid role for assignment submission' },
        { status: 403 }
      )
    }

    // Get assignment
    const assignment = await dbService.getPrisma().assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, classId: true, dueDate: true, allowLateSubmission: true }
    })

    if (!assignment || assignment.classId !== classId) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Check if submission is late
    const now = new Date()
    const isLate = now > new Date(assignment.dueDate)

    // Prevent late submission if not allowed
    if (!assignment.allowLateSubmission && isLate) {
      return NextResponse.json(
        { error: 'Late submissions are not allowed for this assignment' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const files = body.files

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'Files are required' },
        { status: 400 }
      )
    }

    // Check if already submitted
    const existingSubmission = await dbService.getPrisma().submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: userId,
        },
      },
    })

    let result;
    if (existingSubmission) {
      // Update existing submission
      result = await dbService.getPrisma().submission.update({
        where: { id: existingSubmission.id },
        data: {
          files: JSON.stringify(files),
          submittedAt: now,
          isLate,
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
    } else {
      // Create new submission
      result = await dbService.getPrisma().submission.create({
        data: {
          assignmentId,
          studentId: userId,
          files: JSON.stringify(files),
          submittedAt: now,
          isLate,
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
    }

    return NextResponse.json(result, { status: existingSubmission ? 200 : 201 })
  } catch (error) {
    console.error('Failed to submit assignment:', error)
    return NextResponse.json(
      { error: 'Failed to submit assignment' },
      { status: 500 }
    )
  }
}
