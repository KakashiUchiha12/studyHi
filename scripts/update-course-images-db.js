const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const courseSlug = 'complete-web-development-bootcamp-2026';

        // Find the course
        const course = await prisma.course.findUnique({
            where: { slug: courseSlug }
        });

        if (!course) {
            console.log('Course not found');
            return;
        }

        // Update course image
        await prisma.course.update({
            where: { id: course.id },
            data: {
                courseImage: '/uploads/web-dev-course.png'
            }
        });
        console.log('Updated course image to .png');

        // Update module images
        // Based on seed script, we have two modules with images
        const modules = await prisma.courseModule.findMany({
            where: { courseId: course.id }
        });

        for (const mod of modules) {
            if (mod.title === 'HTML & CSS Fundamentals') {
                await prisma.courseModule.update({
                    where: { id: mod.id },
                    data: { moduleImage: '/uploads/courses/modules/html-css-module.png' }
                });
                console.log(`Updated module image: ${mod.title}`);
            } else if (mod.title === 'JavaScript ES6+ Programming') {
                await prisma.courseModule.update({
                    where: { id: mod.id },
                    data: { moduleImage: '/uploads/courses/modules/javascript-module.png' }
                });
                console.log(`Updated module image: ${mod.title}`);
            }
        }

    } catch (error) {
        console.error('Error updating database:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main();
