import { prisma } from '../lib/prisma';

async function listAllDriveContent() {
    const driveId = 'cml8frur40001v5uo3m1qpnrv';
    console.log(`Listing all content for Drive: ${driveId}`);

    const folders = await prisma.driveFolder.findMany({
        where: { driveId, deletedAt: null },
        include: { files: true }
    });

    console.log('--- ALL DRIVE FOLDERS ---');
    for (const f of folders) {
        console.log(`Folder: ${f.name} (ID: ${f.id}, Path: ${f.path})`);
        for (const file of f.files) {
            console.log(`  - File: ${file.originalName}`);
        }
    }
}

listAllDriveContent().finally(() => prisma.$disconnect());
