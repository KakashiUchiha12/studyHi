import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { materialService, chapterService } from '@/lib/database'
import { UpdateMaterialData } from '@/lib/database'
import { syncSubjectFilesToDrive } from '@/lib/drive/subject-sync'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const materialId = (await params).id
    const material = await materialService.getMaterialById(materialId)

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    return NextResponse.json(material)
  } catch (error) {
    console.error('Failed to fetch material:', error)
    return NextResponse.json(
      { error: 'Failed to fetch material' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const materialId = (await params).id
    const data: UpdateMaterialData = await request.json()

    const material = await materialService.updateMaterial(materialId, data)

    // Sync to Drive
    try {
      let subjectId = material.subjectId
      if (!subjectId && material.chapterId) {
        const chapter = await chapterService.getChapterById(material.chapterId)
        if (chapter) subjectId = chapter.subjectId
      }

      if (subjectId) {
        await syncSubjectFilesToDrive({
          userId: (session.user as any).id,
          subjectId
        })
      }
    } catch (syncError) {
      console.error('Failed to sync updated material files to Drive:', syncError)
    }

    return NextResponse.json(material)
  } catch (error) {
    console.error('Failed to update material:', error)
    return NextResponse.json(
      { error: 'Failed to update material' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const materialId = (await params).id
    await materialService.deleteMaterial(materialId)

    return NextResponse.json({ message: 'Material deleted successfully' })
  } catch (error) {
    console.error('Failed to delete material:', error)
    return NextResponse.json(
      { error: 'Failed to delete material' },
      { status: 500 }
    )
  }
}
