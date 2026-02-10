import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

/**
 * POST /api/classes/[id]/join
 * Request to join a class
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

    // Check if invite code was provided (optional if joining by direct ID)
    let inviteCode: string | undefined
    try {
      const body = await request.json()
      inviteCode = body.inviteCode || body.joinCode
    } catch (e) {
      // Body might be empty
    }

    // Find class by ID or join code
    const classData = await dbService.getPrisma().class.findFirst({
      where: {
        OR: [
          { id: classId },
          { joinCode: inviteCode || '' },
        ],
      },
    })

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await dbService.getPrisma().classMember.findUnique({
      where: {
        classId_userId: {
          classId: classData.id,
          userId,
        },
      },
    })

    if (existingMember) {
      if (existingMember.status === 'approved') {
        return NextResponse.json(
          { error: 'Already a member of this class' },
          { status: 400 }
        )
      }
      if (existingMember.status === 'pending') {
        return NextResponse.json(
          { error: 'Join request already pending' },
          { status: 400 }
        )
      }
      if (existingMember.status === 'rejected') {
        // Update existing rejected request to pending
        const updatedMember = await dbService.getPrisma().classMember.update({
          where: {
            classId_userId: {
              classId: classData.id,
              userId,
            },
          },
          data: {
            status: classData.isPrivate ? 'pending' : 'approved',
          },
        })
        return NextResponse.json({
          success: true,
          status: updatedMember.status,
          classId: classData.id
        })
      }
    }

    // Create new member request
    // Public classes auto-approve, private classes stay pending
    const newMember = await dbService.getPrisma().classMember.create({
      data: {
        classId: classData.id,
        userId,
        role: 'student',
        status: classData.isPrivate ? 'pending' : 'approved',
      },
    })

    return NextResponse.json({
      success: true,
      status: newMember.status,
      classId: classData.id
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to join class:', error)
    return NextResponse.json(
      { error: 'Failed to join class' },
      { status: 500 }
    )
  }
}
