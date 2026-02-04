import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q') || '';
        const fileType = searchParams.get('type') || 'all';
        const subjectId = searchParams.get('subject') || 'all';

        // Build where clause
        const where: any = {
            isPublic: true,
            deletedAt: null,
            drive: {
                isPrivate: false, // Only show documents from public drives
            },
        };

        // Add search query
        if (query) {
            where.originalName = {
                contains: query,
                mode: 'insensitive',
            };
        }

        // Add file type filter
        if (fileType !== 'all') {
            where.fileType = fileType;
        }

        // Fetch public documents
        const documents = await prisma.driveFile.findMany({
            where,
            select: {
                id: true,
                originalName: true,
                fileSize: true,
                fileType: true,
                mimeType: true,
                downloadCount: true,
                thumbnailPath: true,
                drive: {
                    select: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                },
                folder: {
                    select: {
                        subject: {
                            select: {
                                id: true,
                                name: true,
                                color: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                downloadCount: 'desc', // Most popular first
            },
            take: 50, // Limit results
        });

        // Transform data
        const transformedDocuments = documents.map((doc) => ({
            id: doc.id,
            originalName: doc.originalName,
            fileSize: doc.fileSize.toString(),
            fileType: doc.fileType,
            mimeType: doc.mimeType,
            downloadCount: doc.downloadCount,
            thumbnailPath: doc.thumbnailPath,
            user: doc.drive.user,
            subject: doc.folder?.subject || null,
        }));

        return NextResponse.json({
            documents: transformedDocuments,
            total: transformedDocuments.length,
        });
    } catch (error) {
        console.error('Error fetching feed documents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch documents' },
            { status: 500 }
        );
    }
}
