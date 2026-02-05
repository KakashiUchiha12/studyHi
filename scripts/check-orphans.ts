import { prisma } from '../lib/prisma';

async function checkOrphans() {
    const subjectId = 'subject-1770062699138-xok2m7q1d';

    const chapters = await prisma.chapter.findMany({
        where: { subjectId: subjectId }
    });
    console.log(`Found ${chapters.length} chapters for subject ${subjectId}`);
    for (const c of chapters) {
        console.log(`- Chapter: ${c.title} (ID: ${c.id})`);
        const materials = await prisma.material.findMany({
            where: { chapterId: c.id }
        });
        console.log(`  Found ${materials.length} materials`);
        for (const m of materials) {
            console.log(`  - Material: ${m.title} (ID: ${m.id}) Content: ${m.content}`);
        }
    }

    const materialsNoChapter = await prisma.material.findMany({
        where: { subjectId: subjectId, chapterId: null as any }
    });
    console.log(`Found ${materialsNoChapter.length} materials with no chapter`);
    for (const m of materialsNoChapter) {
        console.log(`  - Material: ${m.title} (ID: ${m.id})`);
        console.log(`    Content: ${m.content}`);
    }
}

checkOrphans().finally(() => prisma.$disconnect());
