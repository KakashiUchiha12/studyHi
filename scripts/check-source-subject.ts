import { prisma } from '../lib/prisma';

async function checkSourceSubject() {
    // The original user's subject
    const sourceUserId = 'cml5dgg4z0000mv1inayh4ukr';

    const subject = await prisma.subject.findFirst({
        where: {
            userId: sourceUserId,
            name: { contains: 'Operating Systems' }
        },
        include: {
            chapters: {
                include: {
                    materials: true
                }
            }
        }
    });

    if (!subject) {
        console.log('❌ Source subject not found');
        return;
    }

    console.log(`✅ Source Subject: ${subject.name} (ID: ${subject.id})`);
    console.log(`   Chapters: ${subject.chapters.length}`);

    for (const chapter of subject.chapters) {
        console.log(`\n   Chapter: ${chapter.title} (Order: ${chapter.order})`);
        console.log(`   Materials: ${chapter.materials.length}`);

        for (const material of chapter.materials) {
            console.log(`      - ${material.title}`);
        }
    }
}

checkSourceSubject()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
