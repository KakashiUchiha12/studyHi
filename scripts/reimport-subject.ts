import { prisma } from '../lib/prisma';

async function reimportSubject() {
    const destUserId = 'cml5nsvgc0003v5tcaxakk5ps';
    const sourceUserId = 'cml5dgg4z0000mv1inayh4ukr';

    // 1. Delete the existing imported subject and its materials
    const existingSubject = await prisma.subject.findFirst({
        where: {
            userId: destUserId,
            name: { contains: 'Operating Systems' }
        }
    });

    if (existingSubject) {
        console.log(`🗑️  Deleting existing subject: ${existingSubject.name}`);

        // Delete materials first (due to foreign key constraints)
        await prisma.material.deleteMany({
            where: { subjectId: existingSubject.id }
        });

        // Delete chapters
        await prisma.chapter.deleteMany({
            where: { subjectId: existingSubject.id }
        });

        // Delete the subject
        await prisma.subject.delete({
            where: { id: existingSubject.id }
        });

        console.log('✅ Deleted existing subject');
    }

    // 2. Get source subject ID
    const sourceSubject = await prisma.subject.findFirst({
        where: {
            userId: sourceUserId,
            name: { contains: 'Operating Systems' }
        }
    });

    if (!sourceSubject) {
        console.log('❌ Source subject not found');
        return;
    }

    console.log(`\n📥 Re-importing from source: ${sourceSubject.name} (${sourceSubject.id})`);
    console.log('   Please trigger the import from the UI or use the API directly');
    console.log(`   Source User ID: ${sourceUserId}`);
    console.log(`   Source Subject ID: ${sourceSubject.id}`);
}

reimportSubject()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
