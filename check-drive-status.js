const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserDrive() {
    const userId = 'cmldyb76k0003v5qs1qm11npi';
    console.log(`Checking Drive for user: ${userId}`);

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { drive: true }
        });

        if (!user) {
            console.log('User not found.');
            return;
        }

        console.log(`User: ${user.name} (${user.email})`);

        if (!user.drive) {
            console.log('User has NO Drive.');
        } else {
            console.log('Drive found:', JSON.stringify(user.drive, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

            const fileCount = await prisma.driveFile.count({
                where: { driveId: user.drive.id }
            });
            console.log(`Total files in drive: ${fileCount}`);

            const latestFiles = await prisma.driveFile.findMany({
                where: { driveId: user.drive.id },
                orderBy: { createdAt: 'desc' },
                take: 5
            });

            console.log('Latest files:', JSON.stringify(latestFiles, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
        }

    } catch (error) {
        console.error('Error checking drive:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUserDrive();
