import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { isClassAdmin } from '@/lib/classes/permissions'

/**
 * PUT /api/classes/[id]/settings
 * Update class settings (teacher/admin only)
 */
export async function PUT(
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

        // Check if user is admin or teacher
        const hasPermission = await isClassAdmin(classId, userId)

        if (!hasPermission) {
            return NextResponse.json(
                { error: 'Permission denied' },
                { status: 403 }
            )
        }

        const body = await request.json()

        // Validate and sanitize input
        const allowedFields = [
            'name',
            'description',
            'subject',
            'syllabus',
            'room',
            'coverImage',
            'icon',
            'bannerImage',
            'allowStudentPosts',
            'allowComments'
        ]

        const updateData: any = {}

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field]
            }
        }

        // Ensure at least one field is being updated
        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: 'No valid fields to update' },
                { status: 400 }
            )
        }

        // Update the class
        const updatedClass = await dbService.getPrisma().class.update({
            where: { id: classId },
            data: updateData,
            select: {
                id: true,
                name: true,
                description: true,
                subject: true,
                syllabus: true,
                room: true,
                coverImage: true,
                icon: true,
                bannerImage: true,
                allowStudentPosts: true,
                allowComments: true,
                updatedAt: true
            }
        })

        return NextResponse.json(updatedClass)
    } catch (error) {
        console.error('Failed to update class settings:', error)
        return NextResponse.json(
            { error: 'Failed to update class settings' },
            { status: 500 }
        )
    }
}
