import { prisma } from '../lib/prisma';

async function checkDuplicateFiles() {
    const userId = 'cml5nsvgc0003v5tcaxakk5ps';

    // Get the user's drive
    const drive = await prisma.drive.findUnique({
        where: { userId }
    });

    if (!drive) {
        console.log('❌ Drive not found');
        return;
    }

    // Find all DriveFiles with the Chemistry PDF storedName
    const storedName = '1770064581265-7t42qpa46ls.pdf';

    const files = await prisma.driveFile.findMany({
        where: {
            driveId: drive.id,
            storedName: { contains: '1770064581265' }
        },
        include: {
            folder: {
                select: {
                    name: true,
                    path: true
                }
            }
        }
    });

    console.log(`Found ${files.length} files with storedName containing "1770064581265":`);
    for (const file of files) {
        console.log(`  - ${file.originalName}`);
        console.log(`    ID: ${file.id}`);
        console.log(`    Stored Name: ${file.storedName}`);
        console.log(`    Folder: ${file.folder?.name || 'ROOT'} (${file.folder?.path || '/'})`);
        console.log(`    Deleted: ${file.deletedAt ? 'Yes' : 'No'}`);
        console.log('');
    }
}

checkDuplicateFiles()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
