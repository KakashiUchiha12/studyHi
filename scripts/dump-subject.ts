import { prisma } from '../lib/prisma';

async function dumpSubject() {
    const subjectId = 'subject-1770062699138-xok2m7q1d';
    console.log(`Dumping Subject: ${subjectId}`);

    const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
        include: {
            chapters: {
                include: {
                    materials: true
                }
            },
            files: true
        }
    });

    if (!subject) return;

    console.log('--- SUBJECT ---');
    console.log(`Name: ${subject.name}`);
    console.log('Standalone Files:', subject.files.map(f => f.originalName));

    console.log('--- CHAPTERS & MATERIALS ---');
    for (const chapter of subject.chapters) {
        console.log(`Chapter: ${chapter.title}`);
        for (const material of chapter.materials) {
            console.log(`  Material: ${material.title}`);
            console.log(`  Content: ${material.content}`);
        }
    }

    const rootFolder = await prisma.driveFolder.findFirst({
        where: { subjectId: subjectId },
        include: { files: true }
    });

    if (rootFolder) {
        console.log('--- DRIVE ROOT FOLDER ---');
        console.log(`Folder ID: ${rootFolder.id}`);
        for (const file of rootFolder.files) {
            console.log(`  File: ${file.originalName} (ID: ${file.id})`);
        }
    }
}

dumpSubject().finally(() => prisma.$disconnect());
