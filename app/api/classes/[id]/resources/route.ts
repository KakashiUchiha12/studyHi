import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isClassMember, isTeacherOrAdmin } from '@/lib/classes/permissions'

/**
 * GET /api/classes/[id]/resources
 * Get all resources in a class
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

    // Get all resources
    const resources = await dbService.getPrisma().classResource.findMany({
      where: { classId },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    })

    return NextResponse.json(resources)
  } catch (error) {
    console.error('Failed to fetch resources:', error)
    return NextResponse.json(
      { error: 'Failed to fetch resources' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/classes/[id]/resources
 * Upload a new resource (teacher/admin only)
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

    // Check if user is teacher or admin
    const hasPermission = await isTeacherOrAdmin(classId, userId)
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.fileUrl || !body.fileType || !body.fileSize) {
      return NextResponse.json(
        { error: 'Title, file URL, file type, and file size are required' },
        { status: 400 }
      )
    }

    // Create resource
    const resource = await dbService.getPrisma().classResource.create({
      data: {
        classId,
        uploadedBy: userId,
        title: body.title,
        description: body.description || null,
        fileUrl: body.fileUrl,
        fileType: body.fileType,
        fileSize: BigInt(body.fileSize),
        category: body.category || null,
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    })

    return NextResponse.json(resource, { status: 201 })
  } catch (error) {
    console.error('Failed to upload resource:', error)
    return NextResponse.json(
      { error: 'Failed to upload resource' },
      { status: 500 }
    )
  }
}
