import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { generateUniqueJoinCode } from '@/lib/classes/permissions'

/**
 * GET /api/classes
 * Get all classes the user is enrolled in.
 * Supports optional 'query' parameter to filter by name or subject.
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
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')

    const whereClause: any = {
      members: {
        some: {
          userId,
          status: 'approved',
        },
      },
    }

    if (query) {
      whereClause.OR = [
        { name: { contains: query } }, // Prisma default is case-insensitive for some DBs, but explicitly mode: 'insensitive' is better if Postres, but this is MySQL likely or generic
        { subject: { contains: query } },
      ]
    }

    // Get all classes where user is a member
    const memberships = await dbService.getPrisma().classMember.findMany({
      where: {
        userId,
        status: 'approved',
        class: whereClause
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
            members: {
              where: { userId },
              select: { role: true, status: true }
            }
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
        subject: body.subject || null,
        syllabus: body.syllabus || null,
        schedule: body.schedule || null,
        room: body.room || null,
        coverImage: body.coverImage || '#3B82F6', // Default to blue color
        icon: body.icon || null,
        bannerImage: body.bannerImage || body.banner || null, // Handle both key names
        joinCode,
        isPrivate: body.isPrivate || false,
        createdBy: userId,
        allowStudentPosts: body.allowStudentPosts ?? true,
        allowComments: body.allowComments ?? true,
        members: {
          create: {
            userId,
            role: 'admin',
            status: 'approved',
          }
        }
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
        members: {
          where: { userId },
          select: { role: true, status: true }
        }
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
