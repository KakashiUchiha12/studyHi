import { prisma } from '../lib/prisma';

async function checkImport() {
    const userId = 'cml5nsvgc0003v5tcaxakk5ps'; // The user who imported

    // Find their "Operating Systems" subject
    const subject = await prisma.subject.findFirst({
        where: {
            userId: userId,
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
        console.log('❌ Subject not found for user');
        return;
    }

    console.log(`✅ Found Subject: ${subject.name} (ID: ${subject.id})`);
    console.log(`   Chapters: ${subject.chapters.length}`);

    for (const chapter of subject.chapters) {
        console.log(`\n   Chapter: ${chapter.title}`);
        console.log(`   Materials: ${chapter.materials.length}`);

        for (const material of chapter.materials) {
            console.log(`      - ${material.title}`);
            if (material.content) {
                try {
                    const parsed = JSON.parse(material.content);
                    console.log(`        Files: ${parsed.files?.length || 0}`);
                    console.log(`        Links: ${parsed.links?.length || 0}`);
                    if (parsed.files?.length > 0) {
                        for (const f of parsed.files) {
                            console.log(`          * ${f.name} (ID: ${f.id})`);
                        }
                    }
                } catch (e) {
                    console.log(`        Content: ${material.content.substring(0, 50)}...`);
                }
            } else {
                console.log(`        No content`);
            }
        }
    }
}

checkImport()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
