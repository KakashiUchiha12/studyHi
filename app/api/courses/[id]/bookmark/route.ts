import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
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
    const params = await props.params
    const courseId = params.id

    const bookmarkRecord = await dbService.getPrisma().courseBookmark.create({
      data: {
        courseId,
        userId
      }
    })

    return NextResponse.json(bookmarkRecord, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Course already bookmarked' },
        { status: 400 }
      )
    }
    
    console.error('Failed to bookmark course:', error)
    return NextResponse.json(
      { error: 'Failed to bookmark course' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
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
    const params = await props.params
    const courseId = params.id

    await dbService.getPrisma().courseBookmark.delete({
      where: {
        courseId_userId: {
          courseId,
          userId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Bookmark not found' },
        { status: 404 }
      )
    }
    
    console.error('Failed to remove bookmark:', error)
    return NextResponse.json(
      { error: 'Failed to remove bookmark' },
      { status: 500 }
    )
  }
}
