const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Starting migration to make all courses free...');

        // Update all courses to be free
        const coursesUpdate = await prisma.course.updateMany({
            data: {
                isPaid: false,
                price: 0,
                currency: 'USD'
            }
        });
        console.log(`Updated ${coursesUpdate.count} courses to be free.`);

        // Update all chapters to be free (isFree: true)
        const chaptersUpdate = await prisma.courseChapter.updateMany({
            data: {
                isFree: true
            }
        });
        console.log(`Updated ${chaptersUpdate.count} chapters to be free.`);

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Error during migration:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main();
