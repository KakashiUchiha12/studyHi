import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

export class ThumbnailService {
    /**
     * Generate a thumbnail from a file buffer
     * Supports: images (all sharp supports), PDF (first page)
     */
    static async generateThumbnail(
        buffer: Buffer,
        mimeType: string,
        options: { width?: number; height?: number } = { width: 1200 }
    ): Promise<Buffer | null> {
        try {
            if (mimeType.startsWith('image/')) {
                return await this.generateImageThumbnail(buffer, options);
            } else if (mimeType === 'application/pdf') {
                return await this.generatePdfThumbnail(buffer, options);
            }
            return null;
        } catch (error) {
            console.error('Thumbnail generation failed:', error);
            return null;
        }
    }

    /**
     * Resize an image to create a thumbnail
     */
    private static async generateImageThumbnail(
        buffer: Buffer,
        options: { width?: number; height?: number }
    ): Promise<Buffer> {
        return await sharp(buffer)
            .resize(options.width, options.height, {
                fit: 'cover',
                withoutEnlargement: true,
            })
            .webp({ quality: 90 }) // Higher quality WebP
            .toBuffer();
    }

    /**
     * Generate an image from the first page of a PDF using pdf2pic
     */
    private static async generatePdfThumbnail(
        buffer: Buffer,
        options: { width?: number; height?: number }
    ): Promise<Buffer | null> {
        let tempPdfPath = '';
        let tempOutputDir = '';

        try {
            const { fromPath } = await import('pdf2pic');
            const os = await import('os');
            const { v4: uuidv4 } = await import('uuid');

            // Create a temporary file for pdf2pic to read
            const tempDir = os.tmpdir();
            const uniqueId = uuidv4();
            tempPdfPath = path.join(tempDir, `${uniqueId}.pdf`);
            tempOutputDir = path.join(tempDir, `thumb_${uniqueId}`);

            await fs.mkdir(tempOutputDir, { recursive: true });
            await fs.writeFile(tempPdfPath, buffer);

            const convertOptions = {
                density: 300, // Higher density for crisp text
                saveFilename: 'thumb',
                savePath: tempOutputDir,
                format: 'webp',
                width: options.width || 1200,
                height: options.height,
            };

            const convert = fromPath(tempPdfPath, convertOptions);
            const result = await convert(1, false); // Convert page 1

            if (result && result.path) {
                const outputBuffer = await fs.readFile(result.path);
                return outputBuffer;
            }

            return null;
        } catch (error: any) {
            console.error('pdf2pic thumbnail generation error:', error);

            if (error.message?.includes('gm') || error.message?.includes('GraphicsMagick')) {
                console.error('CRITICAL: GraphicsMagick or Ghostscript is not installed. PDF thumbnails will fail until installed.');
            }

            return null;
        } finally {
            // Cleanup
            try {
                if (tempPdfPath) await fs.unlink(tempPdfPath).catch(() => { });
                if (tempOutputDir) await fs.rm(tempOutputDir, { recursive: true, force: true }).catch(() => { });
            } catch (cleanupError) {
                console.error('Cleanup failed:', cleanupError);
            }
        }
    }

    /**
     * Ensure the thumbnail directory exists and returns the path
     */
    static async ensureThumbnailDir(userId: string): Promise<string> {
        const date = new Date();
        const relativeDir = path.join(
            'uploads',
            'thumbnails',
            userId,
            date.getFullYear().toString(),
            (date.getMonth() + 1).toString()
        );
        const fullDir = path.join(process.cwd(), 'public', relativeDir);
        await fs.mkdir(fullDir, { recursive: true });
        return relativeDir;
    }
}
