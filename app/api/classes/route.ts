import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { generateUniqueJoinCode } from '@/lib/classes/permissions'

/**
 * GET /api/classes
 * Get all classes the user is enrolled in
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id

    // Get all classes where user is a member
    const memberships = await dbService.getPrisma().classMember.findMany({
      where: {
        userId,
        status: 'approved',
      },
      include: {
        class: {
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
                members: true,
                assignments: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    })

    const classes = memberships.map((membership) => ({
      ...membership.class,
      role: membership.role,
      memberCount: membership.class._count.members,
      assignmentCount: membership.class._count.assignments,
    }))

    return NextResponse.json(classes)
  } catch (error) {
    console.error('Failed to fetch classes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch classes' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/classes
 * Create a new class
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = (session.user as any).id
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Class name is required' },
        { status: 400 }
      )
    }

    // Generate unique join code
    const joinCode = await generateUniqueJoinCode()

    // Create class
    const newClass = await dbService.getPrisma().class.create({
      data: {
        name: body.name,
        description: body.description || null,
        syllabus: body.syllabus || null,
        coverImage: body.coverImage || '#3B82F6', // Default to blue color
        icon: body.icon || null,
        bannerImage: body.bannerImage || null,
        joinCode,
        createdBy: userId,
        allowStudentPosts: body.allowStudentPosts ?? true,
        allowComments: body.allowComments ?? true,
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

    // Add creator as admin member
    await dbService.getPrisma().classMember.create({
      data: {
        classId: newClass.id,
        userId,
        role: 'admin',
        status: 'approved',
      },
    })

    return NextResponse.json(newClass, { status: 201 })
  } catch (error) {
    console.error('Failed to create class:', error)
    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    )
  }
}
