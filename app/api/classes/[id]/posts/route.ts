import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isClassMember, getUserClassRole } from '@/lib/classes/permissions'

/**
 * GET /api/classes/[id]/posts
 * List all posts in a class
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

    // Check if user is a member
    const isMember = await isClassMember(classId, userId)

    if (!isMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get all posts
    const posts = await dbService.getPrisma().classPost.findMany({
      where: {
        classId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: [
        { pinned: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    const formattedPosts = posts.map(post => ({
      ...post,
      attachments: post.attachments ? JSON.parse(post.attachments) : [],
    }))

    return NextResponse.json(formattedPosts)
  } catch (error) {
    console.error('Failed to fetch posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/classes/[id]/posts
 * Create a new post in a class
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

    // Check if user is a member
    const userRole = await getUserClassRole(classId, userId)

    if (!userRole) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get class settings
    const classData = await dbService.getPrisma().class.findUnique({
      where: { id: classId },
      select: { allowStudentPosts: true },
    })

    if (!classData) {
      return NextResponse.json(
        { error: 'Class not found' },
        { status: 404 }
      )
    }

    // Check if students are allowed to post
    if (userRole === 'student' && !classData.allowStudentPosts) {
      return NextResponse.json(
        { error: 'Students are not allowed to post in this class' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Create post
    const post = await dbService.getPrisma().classPost.create({
      data: {
        classId,
        authorId: userId,
        type: body.type || 'general',
        title: body.title || null,
        content: body.content,
        attachments: body.attachments ? JSON.stringify(body.attachments) : '[]',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Failed to create post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
