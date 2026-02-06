
import { prisma } from "./lib/prisma";

async function main() {
    const course = await prisma.course.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
            modules: {
                orderBy: { order: 'asc' },
                include: {
                    chapters: {
                        orderBy: { order: 'asc' },
                        include: {
                            sections: {
                                orderBy: { order: 'asc' }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!course) {
        console.log("No courses found.");
        return;
    }

    console.log(`Course: ${course.title} (ID: ${course.id})`);
    console.log(`Status: ${course.isPublished ? 'Published' : 'Draft'}`);
    console.log("Structure:");

    course.modules.forEach(mod => {
        console.log(`\n  Module: ${mod.title}`);
        mod.chapters.forEach(chap => {
            console.log(`    Chapter: ${chap.title}`);
            chap.sections.forEach(sec => {
                console.log(`      Lesson: ${sec.title}`);
                console.log(`        Type: ${sec.contentType}`);
                console.log(`        URL: ${sec.videoUrl}`);
                // console.log(`        Content: ${sec.content?.substring(0, 50)}...`);
            });
        });
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
