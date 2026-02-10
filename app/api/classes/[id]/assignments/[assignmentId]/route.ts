import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isClassMember, isTeacherOrAdmin } from '@/lib/classes/permissions'

/**
 * GET /api/classes/[id]/assignments/[assignmentId]
 * Get a single assignment
 */
export async function GET(
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

    // Check if user is a member
    const isMember = await isClassMember(classId, userId)

    if (!isMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get assignment
    const assignment = await dbService.getPrisma().assignment.findUnique({
      where: { id: assignmentId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
        post: {
          select: {
            attachments: true,
          },
        },
      },
    })

    if (!assignment || assignment.classId !== classId) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(assignment)
  } catch (error) {
    console.error('Failed to fetch assignment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignment' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/classes/[id]/assignments/[assignmentId]
 * Update an assignment (teacher/admin only)
 */
export async function PUT(
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

    // Check if assignment exists
    const assignment = await dbService.getPrisma().assignment.findUnique({
      where: { id: assignmentId },
    })

    if (!assignment || assignment.classId !== classId) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Update assignment and linked post in a transaction
    const updatedAssignment = await dbService.getPrisma().$transaction(async (tx) => {
      // Find the assignment first to get its postId
      const existingAssignment = await tx.assignment.findUnique({
        where: { id: assignmentId },
        select: { postId: true }
      })

      if (!existingAssignment) throw new Error('Assignment not found')

      // 1. Update the ClassPost
      if (existingAssignment.postId) {
        await tx.classPost.update({
          where: { id: existingAssignment.postId },
          data: {
            title: body.title,
            content: body.description,
            attachments: body.attachments ? JSON.stringify(body.attachments) : undefined,
          }
        })
      }

      // 2. Update the Assignment
      return await tx.assignment.update({
        where: { id: assignmentId },
        data: {
          title: body.title,
          description: body.description,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          allowLateSubmission: body.allowLateSubmission,
          maxFileSize: body.maxFileSize ? BigInt(body.maxFileSize) : undefined,
        },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      })
    })

    // Format BigInt for JSON response
    const responseData = {
      ...updatedAssignment,
      maxFileSize: Number(updatedAssignment.maxFileSize),
      user: updatedAssignment.teacher
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Failed to update assignment:', error)
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/classes/[id]/assignments/[assignmentId]
 * Delete an assignment (teacher/admin only)
 */
export async function DELETE(
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

    // Check if assignment exists
    const assignment = await dbService.getPrisma().assignment.findUnique({
      where: { id: assignmentId },
    })

    if (!assignment || assignment.classId !== classId) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Delete assignment (cascade will delete submissions and post)
    await dbService.getPrisma().assignment.delete({
      where: { id: assignmentId },
    })

    return NextResponse.json({ message: 'Assignment deleted successfully' })
  } catch (error) {
    console.error('Failed to delete assignment:', error)
    return NextResponse.json(
      { error: 'Failed to delete assignment' },
      { status: 500 }
    )
  }
}
