import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

/**
 * GET /api/classes/join/[code]
 * Get class info by join code (public, for preview before joining)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { code } = await params

    // Find class by join code
    const classData = await dbService.getPrisma().class.findUnique({
      where: { joinCode: code },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            members: {
              where: {
                status: 'approved',
              },
            },
            assignments: true,
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

    // Check if class is archived
    if (classData.archived) {
      return NextResponse.json(
        { error: 'This class has been archived' },
        { status: 410 }
      )
    }

    // Return basic info (don't expose join code in response for security)
    return NextResponse.json({
      id: classData.id,
      name: classData.name,
      description: classData.description,
      coverImage: classData.coverImage,
      creator: classData.creator,
      memberCount: classData._count.members,
      assignmentCount: classData._count.assignments,
      archived: classData.archived,
    })
  } catch (error) {
    console.error('Failed to fetch class by code:', error)
    return NextResponse.json(
      { error: 'Failed to fetch class' },
      { status: 500 }
    )
  }
}
