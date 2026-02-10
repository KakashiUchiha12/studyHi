import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isClassAdmin, isClassMember } from '@/lib/classes/permissions'

/**
 * GET /api/classes/[id]
 * Get detailed information about a specific class
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

    const classData = await dbService.getPrisma().class.findUnique({
      where: { id: classId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        members: {
          where: {
            status: 'approved',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            posts: true,
            assignments: true,
            resources: true,
            members: true,
          },
        },
      },
    })

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Check if user is a member
    const isMember = await isClassMember(classId, userId)

    // If not a member and class is private, deny access
    if (!isMember && classData.isPrivate) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get user's role in the class if they are a member
    // Note: classData.members only includes 'approved' members, so we might need to query separately if we want to show pending status
    // But for now, we rely on the `isClassMember` check which checks for approved status.
    const userMember = classData.members.find((m) => m.userId === userId)

    return NextResponse.json({
      ...classData,
      userRole: userMember?.role || null,
    })
  } catch (error) {
    console.error('Failed to fetch class:', error)
    return NextResponse.json(
      { error: 'Failed to fetch class' },
      { status: 500 }
    )
  }
}

/**
 * Update class details (Unified for PUT and PATCH)
 */
async function updateClass(
  request: NextRequest,
  params: Promise<{ id: string }>
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

    // Check if user is admin
    const isAdmin = await isClassAdmin(classId, userId)

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Update class with all possible fields from both branches
    const updatedClass = await dbService.getPrisma().class.update({
      where: { id: classId },
      data: {
        name: body.name,
        description: body.description,
        syllabus: body.syllabus,
        subject: body.subject,
        schedule: body.schedule,
        room: body.room,
        coverImage: body.coverImage,
        bannerImage: body.bannerImage || body.banner,
        icon: body.icon,
        isPrivate: body.isPrivate,
        allowStudentPosts: body.allowStudentPosts,
        allowComments: body.allowComments,
        archived: body.archived,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(updatedClass)
  } catch (error) {
    console.error('Failed to update class:', error)
    return NextResponse.json(
      { error: 'Failed to update class' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return updateClass(request, params)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return updateClass(request, params)
}

/**
 * DELETE /api/classes/[id]
 * Delete a class (admin only)
 */
export async function DELETE(
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

    // Check if user is admin
    const isAdmin = await isClassAdmin(classId, userId)

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Delete class (cascade will delete all related data)
    await dbService.getPrisma().class.delete({
      where: { id: classId },
    })

    return NextResponse.json({ message: 'Class deleted successfully' })
  } catch (error) {
    console.error('Failed to delete class:', error)
    return NextResponse.json(
      { error: 'Failed to delete class' },
      { status: 500 }
    )
  }
}
