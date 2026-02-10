import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isClassMember, isTeacherOrAdmin } from '@/lib/classes/permissions'

/**
 * GET /api/classes/[id]/assignments
 * Get all assignments in a class
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id: classId } = await params

    // Check if user is a member
    const isMember = await isClassMember(classId, userId)

    if (!isMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get all assignments
    const assignments = await dbService.getPrisma().assignment.findMany({
      where: { classId },
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
        // Include my own submissions
        submissions: {
          where: { studentId: userId },
          select: {
            id: true,
            submittedAt: true,
            isLate: true,
            grade: true,
          },
        },
        // Include post to get attachments
        post: {
          select: {
            attachments: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    const formattedAssignments = assignments.map((assignment: any) => ({
      ...assignment,
      maxFileSize: Number(assignment.maxFileSize),
      attachments: assignment.post?.attachments ? JSON.parse(assignment.post.attachments) : [],
      // Alias teacher to user for frontend compatibility if needed
      user: assignment.teacher,
      userSubmission: assignment.submissions?.[0] || null
    }))

    return NextResponse.json(formattedAssignments)
  } catch (error) {
    console.error('Failed to fetch assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/classes/[id]/assignments
 * Create a new assignment (teacher/admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id: classId } = await params

    // Check if user is teacher or admin
    const hasPermission = await isTeacherOrAdmin(classId, userId)

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.description || !body.dueDate) {
      return NextResponse.json(
        { error: 'Title, description, and due date are required' },
        { status: 400 }
      )
    }

    // Validate due date is not in the past
    const dueDate = new Date(body.dueDate)
    const now = new Date()
    if (dueDate < now) {
      return NextResponse.json(
        { error: 'Due date cannot be in the past' },
        { status: 400 }
      )
    }

    // Create assignment with associated post
    const result = await dbService.getPrisma().$transaction(async (tx) => {
      // Create the post first
      const post = await tx.classPost.create({
        data: {
          classId,
          authorId: userId,
          type: 'assignment',
          title: body.title,
          content: body.description,
          attachments: body.attachments ? JSON.stringify(body.attachments) : '[]',
        },
      })

      // Create the assignment linked to the post
      const assignment = await tx.assignment.create({
        data: {
          classId,
          postId: post.id,
          teacherId: userId,
          title: body.title,
          description: body.description,
          points: body.points || 100,
          dueDate: new Date(body.dueDate),
          allowLateSubmission: body.allowLateSubmission ?? false,
          maxFileSize: body.maxFileSize ? BigInt(body.maxFileSize) : BigInt(268435456),
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

      return assignment
    })

    // Format BigInt for JSON response
    const responseData = {
      ...result,
      maxFileSize: Number(result.maxFileSize),
      user: result.teacher
    }

    return NextResponse.json(responseData, { status: 201 })
  } catch (error) {
    console.error('Failed to create assignment:', error)
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}
