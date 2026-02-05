import { prisma } from '../lib/prisma';
import { syncSubjectFilesToDrive } from '../lib/drive/subject-sync';

async function migrateAll() {
    console.log('🚀 Starting hierarchy migration for all subjects...');

    try {
        const subjects = await prisma.subject.findMany({
            include: { user: true }
        });

        console.log(`Found ${subjects.length} subjects to process.`);

        for (const subject of subjects) {
            console.log(`Processing Subject: "${subject.name}" (ID: ${subject.id}) for User: ${subject.user.email}`);

            try {
                const result = await syncSubjectFilesToDrive({
                    userId: subject.userId,
                    subjectId: subject.id
                });
                console.log(`✅ Synced: ${result.synced} files.`);
            } catch (err: any) {
                console.error(`❌ Failed to sync subject ${subject.name}:`, err.message);
            }
        }

        console.log('✨ Migration complete!');
    } catch (error) {
        console.error('Fatal error during migration:', error);
    } finally {
        await prisma.$disconnect();
    }
}

migrateAll();
