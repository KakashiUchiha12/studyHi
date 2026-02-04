import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { calculateBufferHash } from '@/lib/drive/file-hash';
import {
    isStorageLimitExceeded,
} from '@/lib/drive/storage';

/**
 * POST /api/drive/save-from-url
 * Save a file from a URL to Drive
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;

        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { url, name } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Get user's drive
        let drive = await prisma.drive.findUnique({
            where: { userId: user.id },
        });

        if (!drive) {
            // Create drive if it doesn't exist
            drive = await prisma.drive.create({
                data: {
                    userId: user.id,
                },
            });
        }

        if (!drive) {
            return NextResponse.json({ error: 'Drive not found' }, { status: 404 });
        }

        // Fetch the file
        // Handle both absolute URLs and relative URLs (from same server)
        let fetchUrl = url;
        if (url.startsWith('/')) {
            const origin = request.headers.get('origin') || 'http://localhost:3000';
            fetchUrl = `${origin}${url}`;
        }

        const response = await fetch(fetchUrl);
        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch file from URL' },
                { status: 400 }
            );
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileSize = buffer.length;

        // Check storage limit
        if (isStorageLimitExceeded(drive.storageUsed, drive.storageLimit, fileSize)) {
            return NextResponse.json(
                { error: 'Storage limit exceeded' },
                { status: 400 }
            );
        }

        // Calculate file hash for duplicate detection
        const fileHash = calculateBufferHash(buffer, 'md5');

        // Check for duplicate files
        const existingFile = await prisma.driveFile.findFirst({
            where: {
                driveId: drive.id,
                fileHash,
                deletedAt: null,
            },
        });

        if (existingFile) {
            return NextResponse.json(
                { error: 'File already exists in Drive', existingFile },
                { status: 409 }
            );
        }

        // Determine filename and extension
        let filename = name || 'downloaded-file';
        if (!name) {
            // Try to get filename from Content-Disposition header
            const contentDisposition = response.headers.get('content-disposition');
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="?([^"]+)"?/);
                if (match && match[1]) {
                    filename = match[1];
                }
            } else {
                // Try to get from URL
                const urlPath = new URL(fetchUrl).pathname;
                const basename = path.basename(urlPath);
                if (basename && basename.includes('.')) {
                    filename = basename;
                }
            }
        }

        const fileExt = path.extname(filename) || '';
        const fileType = fileExt.replace('.', '') || 'unknown';
        const mimeType = response.headers.get('content-type') || 'application/octet-stream';

        // Generate storage path
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const uploadDir = path.join(
            process.cwd(),
            'uploads',
            'drives',
            user.id,
            year.toString(),
            month
        );

        // Create directory if it doesn't exist
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const storedName = `${uuidv4()}${fileExt}`;
        const filePath = path.join(uploadDir, storedName);
        const relativeFilePath = path.join(
            'uploads',
            'drives',
            user.id,
            year.toString(),
            month,
            storedName
        );

        // Write file to disk
        await writeFile(filePath, buffer);

        // Create file record in database (root folder)
        const newFile = await prisma.driveFile.create({
            data: {
                driveId: drive.id,
                folderId: null, // Save to root
                originalName: filename,
                storedName,
                fileSize: BigInt(fileSize),
                mimeType,
                fileType,
                fileHash,
                filePath: relativeFilePath,
                isPublic: false,
            },
        });

        // Update storage usage
        await prisma.drive.update({
            where: { id: drive.id },
            data: {
                storageUsed: drive.storageUsed + BigInt(fileSize),
            },
        });

        // Create activity log
        await prisma.driveActivity.create({
            data: {
                driveId: drive.id,
                userId: user.id,
                action: 'upload', // classified as upload/save
                targetType: 'file',
                targetId: newFile.id,
                targetName: filename,
                metadata: JSON.stringify({
                    source: 'feed',
                    sourceUrl: url,
                    fileSize,
                }),
            },
        });

        return NextResponse.json({
            file: {
                ...newFile,
                fileSize: newFile.fileSize.toString(),
            },
            message: 'File saved to Drive successfully',
        }, { status: 201 });

    } catch (error) {
        console.error('Error saving file from URL:', error);
        return NextResponse.json(
            { error: 'Failed to save file to Drive' },
            { status: 500 }
        );
    }
}
