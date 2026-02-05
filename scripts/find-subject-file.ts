import { prisma } from '../lib/prisma';

async function findSubjectFile() {
    const sFile = await prisma.subjectFile.findFirst({
        where: { originalName: '3e5337c9-1e28-466f-b1f5-77378e6c62df.jfif' }
    });
    console.log('SubjectFile:', sFile ? JSON.stringify(sFile, null, 2) : 'Not found');

    // Check DriveFile too
    const dFile = await prisma.driveFile.findFirst({
        where: { originalName: '3e5337c9-1e28-466f-b1f5-77378e6c62df.jfif' }
    });
    console.log('DriveFile:', dFile ? JSON.stringify(dFile, null, 2) : 'Not found');
}

findSubjectFile().finally(() => prisma.$disconnect());
