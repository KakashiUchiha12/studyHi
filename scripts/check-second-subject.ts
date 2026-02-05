import { prisma } from '../lib/prisma';

async function checkSecondSubject() {
    const subjectId = 'cml9jqvoo000jv5esdb3tofuy';
    const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        include: {
            chapters: {
                include: {
                    materials: true
                }
            }
        }
    });

    if (!subject) return;

    console.log(`Subject: ${subject.name} (ID: ${subject.id})`);
    for (const c of subject.chapters) {
        console.log(`Chapter: ${c.title}`);
        for (const m of c.materials) {
            console.log(`  Material: ${m.title} content: ${m.content}`);
        }
    }
}

checkSecondSubject().finally(() => prisma.$disconnect());
