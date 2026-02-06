import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getUserEnrollments,
  fetchCourseList,
  createNewCourse
} from '@/lib/courses/course-operations'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const enrolledParam = searchParams.get('enrolled')

    // Handle "My Enrollments" Fetch
    if (enrolledParam === 'true') {
      const session = await getServerSession(authOptions)
      if (!session?.user || !(session.user as any).id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      const userId = (session.user as any).id
      const enrollments = await getUserEnrollments(userId)
      return NextResponse.json({ enrollments })
    }

    const statusParam = searchParams.get('status')
    const instructorIdParam = searchParams.get('instructorId')
    const slugParam = searchParams.get('slug')

    const filters = {
      category: searchParams.get('category') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      language: searchParams.get('language') || undefined,
      slug: slugParam || undefined,
      // Default to 'published' ONLY for general catalog browse
      // (no slug, no instructorId)
      status: statusParam || (instructorIdParam || slugParam ? undefined : 'published'),
      instructorId: instructorIdParam || undefined,
      search: searchParams.get('search') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      rating: searchParams.get('rating') ? parseFloat(searchParams.get('rating')!) : undefined
    }

    const pagination = {
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      pageSize: searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 12,
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
    }

    const result = await fetchCourseList(filters, pagination)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  let instructorId: string = "unknown";
  let courseData: any = null;
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    instructorId = (session.user as any).id
    courseData = await request.json()

    if (!courseData.title || !courseData.category) {
      return NextResponse.json(
        { error: 'Title and category are required' },
        { status: 400 }
      )
    }

    const newCourse = await createNewCourse(instructorId, courseData)
    return NextResponse.json(newCourse, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create course:', error)
    return NextResponse.json(
      { error: 'Failed to create course', details: error.message },
      { status: 500 }
    )
  }
}
