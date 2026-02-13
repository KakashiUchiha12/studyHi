import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbService } from '@/lib/database'
import { updateDriveFolderForSubject, deleteDriveFolderForSubject } from '@/lib/drive/subject-sync'

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    // Require authentication for updating subjects
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: subjectId } = params
    const body = await req.json()

    // Server-side validation
    const LIMITS = {
      name: 50,
      description: 500,
      code: 20,
      instructor: 100
    }

    if (body.name !== undefined) {
      if (body.name.trim().length === 0) {
        return NextResponse.json({ error: 'Subject name cannot be empty' }, { status: 400 })
      }
      if (body.name.length > LIMITS.name) {
        return NextResponse.json({ error: `Subject name must be less than ${LIMITS.name} characters` }, { status: 400 })
      }
    }

    if (body.description && body.description.length > LIMITS.description) {
      return NextResponse.json({ error: `Description must be less than ${LIMITS.description} characters` }, { status: 400 })
    }

    if (body.code && body.code.length > LIMITS.code) {
      return NextResponse.json({ error: `Subject code must be less than ${LIMITS.code} characters` }, { status: 400 })
    }

    if (body.instructor && body.instructor.length > LIMITS.instructor) {
      return NextResponse.json({ error: `Instructor name must be less than ${LIMITS.instructor} characters` }, { status: 400 })
    }

    // Verify the subject belongs to the user
    const existingSubject = await dbService.getPrisma().subject.findFirst({
      where: { id: subjectId, userId: userId }
    })

    if (!existingSubject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // Merge existing data with updates to prevent data loss
    const updatedSubject = await dbService.getPrisma().subject.update({
      where: { id: subjectId },
      data: {
        ...existingSubject, // Start with existing data
        ...body,            // Overlay with provided updates
        // Ensure specific types/formats if needed
        nextExam: body.nextExam ? new Date(body.nextExam) : (body.nextExam === null ? null : existingSubject.nextExam),
        // Ensure order is handled correctly, as it's a specific update
        order: body.order !== undefined ? body.order : existingSubject.order
      }
    })

    // Convert BigInt to string for JSON serialization
    const serializedSubject = {
      ...updatedSubject,
      order: updatedSubject.order ? updatedSubject.order.toString() : '0'
    }

    // AUTO-SYNC: Rename Drive folder if subject name changed
    if (body.name && body.name !== existingSubject.name) {
      try {
        await updateDriveFolderForSubject({
          subjectId: subjectId,
          newName: body.name
        });
        console.log(`Renamed Drive folder for subject: ${existingSubject.name} -> ${body.name}`);
      } catch (syncError) {
        console.error('Failed to rename Drive folder for subject:', syncError);
      }
    }

    return NextResponse.json(serializedSubject)
  } catch (error) {
    console.error('Failed to update subject:', error)
    return NextResponse.json(
      { error: 'Failed to update subject' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    // Require authentication for deleting subjects
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: subjectId } = await params

    // Verify the subject belongs to the user
    const existingSubject = await dbService.getPrisma().subject.findFirst({
      where: { id: subjectId, userId: userId }
    })

    if (!existingSubject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    await dbService.getPrisma().subject.delete({
      where: { id: subjectId }
    })

    // AUTO-SYNC: Delete Drive folder
    try {
      await deleteDriveFolderForSubject(subjectId);
      console.log(`Deleted Drive folder for subject ID: ${subjectId}`);
    } catch (syncError) {
      console.error('Failed to delete Drive folder for subject:', syncError);
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete subject:', error)
    return NextResponse.json(
      { error: 'Failed to delete subject' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    // Require authentication for updating subjects
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id: subjectId } = await params
    const body = await request.json()

    // Verify the subject belongs to the user
    const existingSubject = await dbService.getPrisma().subject.findFirst({
      where: { id: subjectId, userId: userId }
    })

    if (!existingSubject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    // Update chapter progress
    const updatedSubject = await dbService.getPrisma().subject.update({
      where: { id: subjectId },
      data: {
        totalChapters: body.totalChapters,
        completedChapters: body.completedChapters,
        progress: body.progress
      }
    })

    return NextResponse.json(updatedSubject)
  } catch (error) {
    console.error('Failed to update subject progress:', error)
    return NextResponse.json(
      { error: 'Failed to update subject progress' },
      { status: 500 }
    )
  }
}
