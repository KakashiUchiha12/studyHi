import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { ThumbnailService } from '@/lib/drive/thumbnail-service';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fileUrl = searchParams.get('url');

        if (!fileUrl) {
            return new NextResponse('Missing URL', { status: 400 });
        }

        // Only allow URLs from /uploads/ for security
        if (!fileUrl.startsWith('/uploads/')) {
            return new NextResponse('Invalid URL source', { status: 403 });
        }

        // Resolve local path (public/uploads/...)
        const relativePath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
        const fullPath = path.join(process.cwd(), 'public', relativePath);

        try {
            await fs.access(fullPath);
        } catch (e) {
            return new NextResponse('File not found', { status: 404 });
        }

        // Determine mime type from extension
        const ext = path.extname(fullPath).toLowerCase();
        let mimeType = 'application/octet-stream';
        if (['.jpg', '.jpeg'].includes(ext)) mimeType = 'image/jpeg';
        else if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.webp') mimeType = 'image/webp';
        else if (ext === '.pdf') mimeType = 'application/pdf';

        if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(mimeType)) {
            return new NextResponse('Unsupported file type for thumbnails', { status: 415 });
        }

        // Read file
        const buffer = await fs.readFile(fullPath);

        // Generate thumbnail
        const thumbBuffer = await ThumbnailService.generateThumbnail(buffer, mimeType);

        if (!thumbBuffer) {
            return new NextResponse('Failed to generate thumbnail', { status: 500 });
        }

        return new NextResponse(thumbBuffer, {
            headers: {
                'Content-Type': 'image/webp',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Media thumbnail generation failed:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
