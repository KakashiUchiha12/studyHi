import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

/**
 * POST /api/classes/[id]/join
 * Request to join a class (creates ClassMember with status='pending')
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

    // Check if class exists
    const classExists = await dbService.getPrisma().class.findUnique({
      where: { id: classId },
    })

    if (!classExists) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await dbService.getPrisma().classMember.findUnique({
      where: {
        classId_userId: {
          classId,
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
              classId,
              userId,
            },
          },
          data: {
            status: 'pending',
          },
        })
        return NextResponse.json(updatedMember, { status: 201 })
      }
    }

    // Create new pending member request
    const newMember = await dbService.getPrisma().classMember.create({
      data: {
        classId,
        userId,
        role: 'student',
        status: 'pending',
      },
    })

    return NextResponse.json(newMember, { status: 201 })
  } catch (error) {
    console.error('Failed to join class:', error)
    return NextResponse.json(
      { error: 'Failed to join class' },
      { status: 500 }
    )
  }
}
