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

    // Check if user is a student
    const userRole = await getUserClassRole(classId, userId)
    
    if (!userRole) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    if (userRole !== 'student') {
      return NextResponse.json(
        { error: 'Only students can submit assignments' },
        { status: 403 }
      )
    }

    // Get assignment
    const assignment = await dbService.getPrisma().assignment.findUnique({
      where: { id: assignmentId },
    })

    if (!assignment || assignment.classId !== classId) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Check if submission is late
    const isLate = new Date() > new Date(assignment.dueDate)

    // Prevent late submission if not allowed
    if (!assignment.allowLateSubmission && isLate) {
      return NextResponse.json(
        { error: 'Late submissions are not allowed for this assignment' },
        { status: 400 }
      )
    }

    // Check if student already submitted
    const existingSubmission = await dbService.getPrisma().submission.findUnique({
      where: {
        assignmentId_studentId: {
          assignmentId,
          studentId: userId,
        },
      },
    })

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'You have already submitted this assignment' },
        { status: 400 }
      )
    }

    const body = await request.json()

    if (!body.files || !Array.isArray(body.files)) {
      return NextResponse.json(
        { error: 'Files are required' },
        { status: 400 }
      )
    }

    // Create submission
    const submission = await dbService.getPrisma().submission.create({
      data: {
        assignmentId,
        studentId: userId,
        files: JSON.stringify(body.files),
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

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error('Failed to submit assignment:', error)
    return NextResponse.json(
      { error: 'Failed to submit assignment' },
      { status: 500 }
    )
  }
}
