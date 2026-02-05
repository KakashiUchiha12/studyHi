import { prisma } from '../lib/prisma';

async function checkSubjectMaterials() {
    const sourceUserId = 'cml5dgg4z0000mv1inayh4ukr';

    const subject = await prisma.subject.findFirst({
        where: {
            userId: sourceUserId,
            name: { contains: 'Operating Systems' }
        }
    });

    if (!subject) {
        console.log('❌ Source subject not found');
        return;
    }

    console.log(`✅ Source Subject: ${subject.name} (ID: ${subject.id})`);

    // Check for subject-level materials (chapterId is null)
    const subjectMaterials = await prisma.material.findMany({
        where: {
            subjectId: subject.id,
            chapterId: null
        }
    });

    console.log(`\n📦 Subject-level Materials: ${subjectMaterials.length}`);
    for (const material of subjectMaterials) {
        console.log(`   - ${material.title}`);
        if (material.content) {
            try {
                const parsed = JSON.parse(material.content);
                console.log(`     Files: ${parsed.files?.length || 0}`);
                console.log(`     Links: ${parsed.links?.length || 0}`);
                if (parsed.files?.length > 0) {
                    for (const f of parsed.files) {
                        console.log(`       * ${f.name}`);
                    }
                }
            } catch (e) {
                console.log(`     Content: ${material.content.substring(0, 50)}...`);
            }
        }
    }
}

checkSubjectMaterials()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
