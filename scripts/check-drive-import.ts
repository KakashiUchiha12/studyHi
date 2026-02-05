import { prisma } from '../lib/prisma';

async function checkDriveImport() {
    const userId = 'cml5nsvgc0003v5tcaxakk5ps';

    // Get the user's drive
    const drive = await prisma.drive.findUnique({
        where: { userId }
    });

    if (!drive) {
        console.log('❌ Drive not found');
        return;
    }

    console.log(`✅ Drive found for user (ID: ${drive.id})`);

    // Get all folders
    const folders = await prisma.driveFolder.findMany({
        where: { driveId: drive.id, deletedAt: null },
        include: {
            files: {
                where: { deletedAt: null }
            }
        },
        orderBy: { path: 'asc' }
    });

    console.log(`\n📁 Found ${folders.length} folders:`);
    for (const folder of folders) {
        console.log(`\n  ${folder.path}`);
        console.log(`    Files: ${folder.files.length}`);
        if (folder.files.length > 0) {
            for (const file of folder.files) {
                console.log(`      - ${file.originalName}`);
            }
        }
    }

    // Check the imported subject's materials
    const subject = await prisma.subject.findFirst({
        where: { userId, name: { contains: 'Operating Systems' } },
        include: {
            materials: true
        }
    });

    if (subject) {
        console.log(`\n📚 Subject: ${subject.name}`);
        console.log(`   Materials: ${subject.materials.length}`);
        for (const material of subject.materials) {
            console.log(`\n   Material: ${material.title}`);
            if (material.content) {
                try {
                    const parsed = JSON.parse(material.content);
                    console.log(`     Files: ${parsed.files?.length || 0}`);
                    console.log(`     Links: ${parsed.links?.length || 0}`);
                    if (parsed.files?.length > 0) {
                        for (const f of parsed.files) {
                            console.log(`       * ${f.name} (ID: ${f.id})`);
                        }
                    }
                } catch (e) {
                    console.log(`     Content: ${material.content.substring(0, 50)}...`);
                }
            }
        }
    }
}

checkDriveImport()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
