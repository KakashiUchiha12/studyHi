import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isClassMember } from '@/lib/classes/permissions'

/**
 * POST /api/classes/[id]/posts/[postId]/like
 * Toggle like on a post (create or delete)
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

    // Check if user already liked the post
    const existingLike = await dbService.getPrisma().postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    })

    if (existingLike) {
      // Unlike - delete the like
      await dbService.getPrisma().postLike.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      })

      return NextResponse.json({ liked: false, message: 'Post unliked' })
    } else {
      // Like - create the like
      await dbService.getPrisma().postLike.create({
        data: {
          postId,
          userId,
        },
      })

      return NextResponse.json({ liked: true, message: 'Post liked' })
    }
  } catch (error) {
    console.error('Failed to toggle like:', error)
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    )
  }
}
