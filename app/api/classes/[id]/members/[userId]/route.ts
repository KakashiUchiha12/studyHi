import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isClassAdmin } from '@/lib/classes/permissions'

/**
 * DELETE /api/classes/[id]/members/[userId]
 * Remove a member from the class (admin only)
 */
export async function DELETE(
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

    // Prevent removing self if you're the only admin
    if (currentUserId === userId) {
      const adminCount = await dbService.getPrisma().classMember.count({
        where: {
          classId,
          role: 'admin',
          status: 'approved',
        },
      })

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the only admin' },
          { status: 400 }
        )
      }
    }

    // Delete the member
    await dbService.getPrisma().classMember.delete({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
    })

    return NextResponse.json({ message: 'Member removed successfully' })
  } catch (error) {
    console.error('Failed to remove member:', error)
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    )
  }
}
