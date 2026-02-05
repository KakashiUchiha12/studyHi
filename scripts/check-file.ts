import { prisma } from '../lib/prisma';

async function checkFile() {
    const fileId = 'cml5mr02b0001v5tcuyy87yvw'; // From the Material content
    const subjectFile = await prisma.subjectFile.findUnique({ where: { id: fileId } });
    const driveFile = await prisma.driveFile.findUnique({ where: { id: fileId } });

    console.log('--- FILE CHECK ---');
    console.log('SubjectFile:', subjectFile ? JSON.stringify(subjectFile, null, 2) : 'Not found');
    console.log('DriveFile:', driveFile ? JSON.stringify(driveFile, null, 2) : 'Not found');
}

checkFile().finally(() => prisma.$disconnect());
