import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isClassMember } from '@/lib/classes/permissions'

/**
 * GET /api/classes/[id]/posts/[postId]/comments
 * Get all comments for a post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
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
    const { id: classId, postId } = await params

    // Check if user is a member
    const isMember = await isClassMember(classId, userId)
    
    if (!isMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Verify post belongs to class
    const post = await dbService.getPrisma().classPost.findUnique({
      where: { id: postId },
    })

    if (!post || post.classId !== classId) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Get comments
    const comments = await dbService.getPrisma().postComment.findMany({
      where: { postId },
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
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/classes/[id]/posts/[postId]/comments
 * Create a comment on a post
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
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
    const { id: classId, postId } = await params

    // Check if user is a member
    const isMember = await isClassMember(classId, userId)
    
    if (!isMember) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Verify post exists and get class settings
    const post = await dbService.getPrisma().classPost.findUnique({
      where: { id: postId },
      include: {
        class: {
          select: { allowComments: true },
        },
      },
    })

    if (!post || post.classId !== classId) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if comments are allowed
    if (!post.class.allowComments) {
      return NextResponse.json(
        { error: 'Comments are not allowed in this class' },
        { status: 403 }
      )
    }

    const body = await request.json()

    if (!body.content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    // Create comment
    const comment = await dbService.getPrisma().postComment.create({
      data: {
        postId,
        authorId: userId,
        content: body.content,
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

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Failed to create comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
