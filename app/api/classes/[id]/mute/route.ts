import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isClassMember } from '@/lib/classes/permissions'

/**
 * PUT /api/classes/[id]/mute
 * Toggle muted notifications for current user
 */
export async function PUT(
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

    const body = await request.json()
    const { muted } = body

    if (typeof muted !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid muted value' },
        { status: 400 }
      )
    }

    // Update muted notifications
    const updatedMember = await dbService.getPrisma().classMember.update({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
      data: {
        mutedNotifications: muted,
      },
    })

    return NextResponse.json(updatedMember)
  } catch (error) {
    console.error('Failed to update notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    )
  }
}
