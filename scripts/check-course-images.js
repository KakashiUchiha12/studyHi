const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const courses = await prisma.course.findMany({
            select: {
                id: true,
                title: true,
                courseImage: true,
                slug: true
            }
        });
        console.log('COURSES_DATA_START');
        console.log(JSON.stringify(courses, null, 2));
        console.log('COURSES_DATA_END');
    } catch (error) {
        console.error('Error fetching courses:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main();
