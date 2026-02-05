import { prisma } from '../lib/prisma';

async function findAllMaterials() {
    const subjectId = 'subject-1770062699138-xok2m7q1d';
    const materials = await prisma.material.findMany({
        where: { subjectId: subjectId }
    });
    console.log(`Total materials found for subject: ${materials.length}`);
    for (const m of materials) {
        console.log(`- Material: ${m.title} (ID: ${m.id}) Chapter: ${m.chapterId}`);
        console.log(`  Content: ${m.content}`);
    }
}

findAllMaterials().finally(() => prisma.$disconnect());
