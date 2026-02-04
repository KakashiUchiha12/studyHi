import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * GET /api/drive/search - Search files and folders
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type'); // 'file' | 'folder' | 'all'
    const fileType = searchParams.get('fileType'); // extension filter
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const drive = await prisma.drive.findUnique({
      where: { userId: session.user.id },
    });

    if (!drive) {
      return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
    }

    const results: any = { files: [], folders: [] };

    // Search files
    if (!type || type === 'all' || type === 'file') {
      const fileWhere: any = {
        driveId: drive.id,
        deletedAt: null,
        OR: [
          { originalName: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { contains: query, mode: 'insensitive' } },
        ],
      };

      if (fileType) {
        fileWhere.fileType = fileType;
      }

      if (dateFrom || dateTo) {
        fileWhere.createdAt = {};
        if (dateFrom) fileWhere.createdAt.gte = new Date(dateFrom);
        if (dateTo) fileWhere.createdAt.lte = new Date(dateTo);
      }

      results.files = await prisma.driveFile.findMany({
        where: fileWhere,
        select: {
          id: true,
          originalName: true,
          fileSize: true,
          fileType: true,
          mimeType: true,
          thumbnailPath: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          folderId: true,
          folder: {
            select: {
              id: true,
              name: true,
              path: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      });
    }

    // Search folders
    if (!type || type === 'all' || type === 'folder') {
      const folderWhere: any = {
        driveId: drive.id,
        deletedAt: null,
        name: { contains: query, mode: 'insensitive' },
      };

      if (dateFrom || dateTo) {
        folderWhere.createdAt = {};
        if (dateFrom) folderWhere.createdAt.gte = new Date(dateFrom);
        if (dateTo) folderWhere.createdAt.lte = new Date(dateTo);
      }

      results.folders = await prisma.driveFolder.findMany({
        where: folderWhere,
        select: {
          id: true,
          name: true,
          path: true,
          isPublic: true,
          createdAt: true,
          updatedAt: true,
          parentId: true,
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching drive:', error);
    return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
  }
}
