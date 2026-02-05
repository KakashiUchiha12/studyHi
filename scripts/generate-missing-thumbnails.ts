import { prisma } from '../lib/prisma';
import { fileService } from '../lib/database/file-service';
import { ThumbnailService } from '../lib/drive/thumbnail-service';
import fs from 'fs/promises';
import path from 'path';

async function migrate() {
    console.log('🚀 Starting thumbnail generation for missing files...');

    // 1. Process SubjectFiles
    const subjectFiles = await prisma.subjectFile.findMany({
        where: {
            thumbnailPath: null,
            OR: [
                { mimeType: { startsWith: 'image/' } },
                { mimeType: 'application/pdf' }
            ]
        }
    });

    console.log(`Found ${subjectFiles.length} SubjectFiles needing thumbnails.`);

    for (const file of subjectFiles) {
        console.log(`Processing SubjectFile: ${file.originalName} (${file.id})`);
        try {
            const thumbPath = await fileService.createThumbnail(
                file.filePath,
                file.fileName,
                file.subjectId,
                file.userId,
                file.mimeType
            );

            if (thumbPath) {
                await prisma.subjectFile.update({
                    where: { id: file.id },
                    data: { thumbnailPath: thumbPath }
                });
                console.log(`✅ Generated: ${thumbPath}`);
            }
        } catch (err: any) {
            console.error(`❌ Failed for ${file.originalName}:`, err.message);
        }
    }

    // 2. Process DriveFiles
    const driveFiles = await prisma.driveFile.findMany({
        where: {
            thumbnailPath: null,
            deletedAt: null,
            OR: [
                { mimeType: { startsWith: 'image/' } },
                { mimeType: 'application/pdf' }
            ]
        },
        include: {
            drive: {
                select: { userId: true }
            }
        }
    });

    console.log(`Found ${driveFiles.length} DriveFiles needing thumbnails.`);

    for (const file of driveFiles) {
        console.log(`Processing DriveFile: ${file.originalName} (${file.id})`);
        try {
            const fullPath = path.isAbsolute(file.filePath) ? file.filePath : path.join(process.cwd(), file.filePath);
            const buffer = await fs.readFile(fullPath);
            const thumbBuffer = await ThumbnailService.generateThumbnail(buffer, file.mimeType);

            if (thumbBuffer) {
                const thumbRelDir = await ThumbnailService.ensureThumbnailDir(file.drive.userId);
                const fileId = path.parse(file.storedName).name;
                const thumbName = `${fileId}_thumb.webp`;
                const thumbnailPath = path.join(thumbRelDir, thumbName).replace(/\\/g, '/');

                const fullThumbPath = path.join(process.cwd(), thumbnailPath);
                await fs.writeFile(fullThumbPath, thumbBuffer);

                await prisma.driveFile.update({
                    where: { id: file.id },
                    data: { thumbnailPath: thumbnailPath }
                });
                console.log(`✅ Generated: ${thumbnailPath}`);
            }
        } catch (err: any) {
            console.error(`❌ Failed for DriveFile ${file.originalName}:`, err.message);
        }
    }

    console.log('✨ Migration complete!');
}

migrate()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
