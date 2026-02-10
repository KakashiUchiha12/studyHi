import { NextResponse } from 'next/server'
import { dbService } from '@/lib/database'

/**
 * Check if a class exists before proceeding with the request
 * Returns null if class exists, or NextResponse error if not
 */
export async function checkClassExists(classId: string): Promise<NextResponse | null> {
    try {
        const classExists = await dbService.getPrisma().class.findUnique({
            where: { id: classId },
            select: { id: true }
        })

        if (!classExists) {
            return NextResponse.json(
                {
                    error: 'Class not found',
                    message: 'This class may have been deleted or you may not have access to it.',
                    code: 'CLASS_NOT_FOUND'
                },
                { status: 404 }
            )
        }

        return null
    } catch (error) {
        console.error('Error checking class existence:', error)
        return NextResponse.json(
            { error: 'Failed to verify class' },
            { status: 500 }
        )
    }
}

/**
 * Check if an assignment exists before proceeding
 */
export async function checkAssignmentExists(assignmentId: string, classId: string): Promise<NextResponse | null> {
    try {
        const assignment = await dbService.getPrisma().assignment.findFirst({
            where: {
                id: assignmentId,
                classId: classId
            },
            select: { id: true }
        })

        if (!assignment) {
            return NextResponse.json(
                {
                    error: 'Assignment not found',
                    message: 'This assignment may have been deleted.',
                    code: 'ASSIGNMENT_NOT_FOUND'
                },
                { status: 404 }
            )
        }

        return null
    } catch (error) {
        console.error('Error checking assignment existence:', error)
        return NextResponse.json(
            { error: 'Failed to verify assignment' },
            { status: 500 }
        )
    }
}
