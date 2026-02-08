import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isClassAdmin } from '@/lib/classes/permissions'

/**
 * GET /api/classes/[id]/members/pending
 * Get all pending join requests (admin only)
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

    // Check if user is admin
    const isAdmin = await isClassAdmin(classId, userId)
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get all pending join requests
    const pendingMembers = await dbService.getPrisma().classMember.findMany({
      where: {
        classId,
        status: 'pending',
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
      orderBy: {
        joinedAt: 'desc',
      },
    })

    return NextResponse.json(pendingMembers)
  } catch (error) {
    console.error('Failed to fetch pending requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending requests' },
      { status: 500 }
    )
  }
}
