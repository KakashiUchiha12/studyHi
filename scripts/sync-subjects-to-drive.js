
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncSubjects() {
    console.log('Starting Subject-Drive Sync...');

    try {
        // 1. Get all users
        const users = await prisma.user.findMany({
            include: {
                subjects: true,
                drive: true
            }
        });

        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            console.log(`Processing user: ${user.name} (${user.id})`);

            if (!user.drive) {
                console.log(`- User has no Drive. Skipping.`);
                continue;
            }

            for (const subject of user.subjects) {
                // Check if folder exists
                const folderName = `Subjects - ${subject.name}`;
                const existingFolder = await prisma.driveFolder.findFirst({
                    where: {
                        driveId: user.drive.id,
                        subjectId: subject.id,
                        deletedAt: null
                    }
                });

                if (existingFolder) {
                    console.log(`  - Subject "${subject.name}": Folder already exists.`);
                    continue;
                }

                console.log(`  - Subject "${subject.name}": Creating folder...`);

                // Create folder
                await prisma.driveFolder.create({
                    data: {
                        driveId: user.drive.id,
                        name: folderName,
                        path: `/${folderName}`,
                        subjectId: subject.id,
                        isPublic: false,
                    }
                });
                console.log(`    -> Created: ${folderName}`);
            }
        }

        console.log('\nSync completed successfully!');

    } catch (error) {
        console.error('Error syncing subjects:', error);
    } finally {
        await prisma.$disconnect();
    }
}

syncSubjects();
