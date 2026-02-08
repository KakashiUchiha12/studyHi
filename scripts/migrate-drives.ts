
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting drive migration...');

    // 1. Find users with multiple drives
    const usersWithDrives = await prisma.user.findMany({
        include: {
            drive: true
        }
    });

    console.log(`Checking ${usersWithDrives.length} users for multiple drives...`);

    for (const user of usersWithDrives) {
        // Prisma `drive` relation is 1-to-1 in the schema typically, but if it was 
        // defined as 1-to-many or if the database constraint is missing, we might have issues.
        // Let's check the Drive table directly for this user.

        const drives = await prisma.drive.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'asc' }, // Oldest first
            include: {
                _count: {
                    select: {
                        folders: true,
                        files: true
                    }
                }
            }
        });

        if (drives.length <= 1) {
            continue;
        }

        console.log(`User ${user.name} (${user.id}) has ${drives.length} drives.`);

        // 2. Determine primary drive
        // Strategy: Use the drive with the most files/folders, or the oldest if equal.
        let primaryDrive = drives[0];
        let maxContent = (drives[0]._count?.files || 0) + (drives[0]._count?.folders || 0);

        for (let i = 1; i < drives.length; i++) {
            const contentCount = (drives[i]._count?.files || 0) + (drives[i]._count?.folders || 0);
            if (contentCount > maxContent) {
                primaryDrive = drives[i];
                maxContent = contentCount;
            }
        }

        console.log(`Selected primary drive: ${primaryDrive.id} (Files: ${primaryDrive._count?.files}, Folders: ${primaryDrive._count?.folders})`);

        // 3. Migrate content
        const drivesToDelete = drives.filter(d => d.id !== primaryDrive.id);

        for (const drive of drivesToDelete) {
            console.log(`Migrating content from ${drive.id} to ${primaryDrive.id}...`);

            // Move Folders
            const folderUpdate = await prisma.driveFolder.updateMany({
                where: { driveId: drive.id },
                data: { driveId: primaryDrive.id }
            });
            console.log(`  Moved ${folderUpdate.count} folders.`);

            // Move Files
            const fileUpdate = await prisma.driveFile.updateMany({
                where: { driveId: drive.id },
                data: { driveId: primaryDrive.id }
            });
            console.log(`  Moved ${fileUpdate.count} files.`);

            // Move Activity Logs
            const activityUpdate = await prisma.driveActivity.updateMany({
                where: { driveId: drive.id },
                data: { driveId: primaryDrive.id }
            });
            console.log(`  Moved ${activityUpdate.count} activity logs.`);

            // Update Storage Used
            const storageToAdd = BigInt(drive.storageUsed ?? 0);
            if (storageToAdd > 0) {
                await prisma.drive.update({
                    where: { id: primaryDrive.id },
                    data: {
                        storageUsed: { increment: storageToAdd }
                    }
                });
                console.log(`  Updated storage usage.`);
            }

            // Delete the empty drive
            await prisma.drive.delete({
                where: { id: drive.id }
            });
            console.log(`  Deleted secondary drive ${drive.id}.`);
        }
    }

    console.log('Migration complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
