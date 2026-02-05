import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { updateCourseStatistics } from '@/lib/courses/course-operations'

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string; reviewId: string }> }
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
    const { id: courseId, reviewId } = params
    
    const reviewRecord = await dbService.getPrisma().courseReview.findFirst({
      where: {
        id: reviewId,
        courseId,
        userId
      }
    })

    if (!reviewRecord) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      )
    }

    const updateData = await request.json()

    if (updateData.rating && (updateData.rating < 1 || updateData.rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const updatedReview = await dbService.getPrisma().courseReview.update({
      where: { id: reviewId },
      data: {
        rating: updateData.rating,
        comment: updateData.comment
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    })

    await updateCourseStatistics(courseId)

    return NextResponse.json(updatedReview)
  } catch (error) {
    console.error('Failed to update review:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string; reviewId: string }> }
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
    const { id: courseId, reviewId } = params
    
    const reviewRecord = await dbService.getPrisma().courseReview.findFirst({
      where: {
        id: reviewId,
        courseId,
        userId
      }
    })

    if (!reviewRecord) {
      return NextResponse.json(
        { error: 'Review not found or unauthorized' },
        { status: 404 }
      )
    }

    await dbService.getPrisma().courseReview.delete({
      where: { id: reviewId }
    })

    await updateCourseStatistics(courseId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
