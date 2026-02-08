import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isClassAdmin } from '@/lib/classes/permissions'

/**
 * PUT /api/classes/[id]/members/[userId]/approve
 * Approve a pending join request (admin only)
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

    // Check if member exists and is pending
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
        { error: 'Member request not found' },
        { status: 404 }
      )
    }

    if (member.status !== 'pending') {
      return NextResponse.json(
        { error: 'Member request is not pending' },
        { status: 400 }
      )
    }

    // Approve the member
    const updatedMember = await dbService.getPrisma().classMember.update({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
      data: {
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
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Failed to approve member:', error)
    return NextResponse.json(
      { error: 'Failed to approve member' },
      { status: 500 }
    )
  }
}
