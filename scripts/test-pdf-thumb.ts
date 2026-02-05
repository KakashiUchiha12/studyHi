import { ThumbnailService } from '../lib/drive/thumbnail-service';
import fs from 'fs/promises';
import path from 'path';

async function testThumbnail() {
    const filePath = 'D:\\StudyHi app 27th January\\public\\uploads\\files\\cml5dgg4z0000mv1inayh4ukr\\subject-1770062699138-xok2m7q1d\\1770064581265-7t42qpa46ls.pdf';
    console.log(`Testing thumbnail for: ${filePath}`);

    try {
        const buffer = await fs.readFile(filePath);
        const thumb = await ThumbnailService.generateThumbnail(buffer, 'application/pdf');

        if (thumb) {
            console.log('✅ Thumbnail generated successfully!');
            const outPath = path.join(process.cwd(), 'test_thumb.webp');
            await fs.writeFile(outPath, thumb);
            console.log(`Saved to: ${outPath}`);
        } else {
            console.log('❌ Thumbnail generation returned null');
        }
    } catch (error) {
        console.error('❌ Error in test:', error);
    }
}

testThumbnail();
