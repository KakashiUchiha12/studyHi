import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isTeacherOrAdmin } from '@/lib/classes/permissions'

/**
 * DELETE /api/classes/[id]/resources/[resourceId]
 * Delete a resource (teacher/admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
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
    const { id: classId, resourceId } = await params

    // Check if user is teacher or admin
    const hasPermission = await isTeacherOrAdmin(classId, userId)
    
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied' },
        { status: 403 }
      )
    }

    // Check if resource exists
    const resource = await dbService.getPrisma().classResource.findUnique({
      where: { id: resourceId },
    })

    if (!resource || resource.classId !== classId) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Delete resource
    await dbService.getPrisma().classResource.delete({
      where: { id: resourceId },
    })

    return NextResponse.json({ message: 'Resource deleted successfully' })
  } catch (error) {
    console.error('Failed to delete resource:', error)
    return NextResponse.json(
      { error: 'Failed to delete resource' },
      { status: 500 }
    )
  }
}
