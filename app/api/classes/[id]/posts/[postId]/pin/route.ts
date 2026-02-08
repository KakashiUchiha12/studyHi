import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isTeacherOrAdmin } from '@/lib/classes/permissions'

/**
 * PUT /api/classes/[id]/posts/[postId]/pin
 * Toggle pin status (admin/teacher only)
 */
export async function PUT(
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

    // Check if user is teacher or admin
    const hasPermission = await isTeacherOrAdmin(classId, userId)
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Check if post exists
    const post = await dbService.getPrisma().classPost.findUnique({
      where: { id: postId },
    })

    if (!post || post.classId !== classId) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Toggle pin status
    const updatedPost = await dbService.getPrisma().classPost.update({
      where: { id: postId },
      data: {
        pinned: !post.pinned,
      },
    })

    return NextResponse.json(updatedPost)
  } catch (error) {
    console.error('Failed to toggle pin:', error)
    return NextResponse.json(
      { error: 'Failed to toggle pin' },
      { status: 500 }
    )
  }
}
