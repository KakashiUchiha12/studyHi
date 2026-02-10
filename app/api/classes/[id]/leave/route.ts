import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

/**
 * POST /api/classes/[id]/leave
 * Current user leaves the class
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
        { error: 'Not a member of this class' },
        { status: 400 }
      )
    }

    // Check if user is the class owner/creator
    const classData = await dbService.getPrisma().class.findUnique({
      where: { id: classId },
      select: { createdBy: true },
    })

    if (classData?.createdBy === userId) {
      return NextResponse.json(
        { error: 'Class owners cannot leave their own class' },
        { status: 400 }
      )
    }

    // Delete membership
    await dbService.getPrisma().classMember.delete({
      where: {
        classId_userId: {
          classId,
          userId,
        },
      },
    })

    return NextResponse.json({ success: true, message: 'Left class successfully' })
  } catch (error) {
    console.error('Failed to leave class:', error)
    return NextResponse.json(
      { error: 'Failed to leave class' },
      { status: 500 }
    )
  }
}
