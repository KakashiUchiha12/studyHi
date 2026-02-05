import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { retrieveEnrollmentByIdentifiers } from '@/lib/courses/progress-tracker'
import { updateCourseStatistics } from '@/lib/courses/course-operations'

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params
    const courseId = params.id
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const skipAmount = (page - 1) * pageSize

    const [reviewsList, totalCount] = await Promise.all([
      dbService.getPrisma().courseReview.findMany({
        where: { courseId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: skipAmount,
        take: pageSize
      }),
      dbService.getPrisma().courseReview.count({ where: { courseId } })
    ])

    return NextResponse.json({
      reviews: reviewsList,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / pageSize)
    })
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}

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

    const studentId = (session.user as any).id
    const params = await props.params
    const courseId = params.id
    const reviewData = await request.json()

    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    const enrollmentRecord = await retrieveEnrollmentByIdentifiers(courseId, studentId)

    if (!enrollmentRecord) {
      return NextResponse.json(
        { error: 'Must be enrolled to leave a review' },
        { status: 403 }
      )
    }

    if (enrollmentRecord.progress < 30) {
      return NextResponse.json(
        { error: 'Must complete at least 30% of the course to leave a review' },
        { status: 403 }
      )
    }

    const newReview = await dbService.getPrisma().courseReview.create({
      data: {
        courseId,
        userId: studentId,
        rating: reviewData.rating,
        comment: reviewData.comment
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

    return NextResponse.json(newReview, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'You have already reviewed this course' },
        { status: 400 }
      )
    }
    
    console.error('Failed to create review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}
