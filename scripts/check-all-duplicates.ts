import { prisma } from '../lib/prisma';

async function checkAllDuplicates() {
    // Check for ALL files with this storedName across ALL drives
    const storedName = '1770064581265-7t42qpa46ls.pdf';

    const allFiles = await prisma.driveFile.findMany({
        where: {
            storedName: storedName
        },
        include: {
            drive: {
                select: {
                    userId: true,
                    user: {
                        select: {
                            email: true
                        }
                    }
                }
            },
            folder: {
                select: {
                    name: true,
                    path: true
                }
            }
        }
    });

    console.log(`Found ${allFiles.length} files with storedName "${storedName}" across ALL drives:`);
    for (const file of allFiles) {
        console.log(`\n  File: ${file.originalName}`);
        console.log(`    ID: ${file.id}`);
        console.log(`    Drive User: ${file.drive.user.email}`);
        console.log(`    Folder: ${file.folder?.name || 'ROOT'} (${file.folder?.path || '/'})`);
        console.log(`    Deleted: ${file.deletedAt ? 'Yes' : 'No'}`);
    }
}

checkAllDuplicates()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
