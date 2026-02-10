import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isTeacherOrAdmin, canPinPosts } from '@/lib/classes/permissions'

/**
 * Toggle pin status (admin/teacher only)
 */
async function togglePin(
  request: NextRequest,
  params: Promise<{ id: string; postId: string }> | { id: string; postId: string }
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

    // Handle both Promise and synchronous params (Next.js 15 compatibility)
    const resolvedParams = params instanceof Promise ? await params : params
    const { id: classId, postId } = resolvedParams

    // Check if user has permission to pin posts
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
      select: { id: true, classId: true, pinned: true }
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  return togglePin(request, params)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  return togglePin(request, params)
}
