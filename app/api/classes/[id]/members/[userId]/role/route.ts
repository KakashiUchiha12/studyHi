import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isClassAdmin } from '@/lib/classes/permissions'

/**
 * PUT /api/classes/[id]/members/[userId]/role
 * Change a member's role (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const currentUserId = (session.user as any).id
    const { id: classId, userId } = await params

    // Check if user is admin
    const isAdmin = await isClassAdmin(classId, currentUserId)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { role } = body

    // Validate role
    if (!['student', 'teacher', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if member exists
    const member = await dbService.getPrisma().classMember.findUnique({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    // Prevent demoting self if you're the only admin
    if (currentUserId === userId && member.role === 'admin' && role !== 'admin') {
      const adminCount = await dbService.getPrisma().classMember.count({
        where: {
          classId,
          role: 'admin',
          status: 'approved',
        },
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot demote the only admin' },
          { status: 400 }
        )
      }
    }

    // Update role
    const updatedMember = await dbService.getPrisma().classMember.update({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
      data: {
        role,
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
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Failed to update role:', error)
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    )
  }
}
