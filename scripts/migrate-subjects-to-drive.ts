// Migration script to sync existing subjects to Drive
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateSubjectsToDrive() {
    console.log('🚀 Starting subject-to-drive migration...\n');

    try {
        // Get all users
        const users = await prisma.user.findMany({
            include: {
                subjects: {
                    include: {
                        files: true,
                    },
                },
                drive: true,
            },
        });

        console.log(`Found ${users.length} users to process\n`);

        for (const user of users) {
            console.log(`Processing user: ${user.name} (${user.id})`);

            // Create drive if doesn't exist
            let drive = user.drive;
            if (!drive) {
                console.log('  Creating drive...');
                drive = await prisma.drive.create({
                    data: {
                        userId: user.id,
                        storageLimit: BigInt(10737418240), // 10GB
                        bandwidthLimit: BigInt(10737418240), // 10GB
                    },
                });
                console.log('  ✅ Drive created');
            } else {
                console.log('  ✅ Drive already exists');
            }

            // Process each subject
            for (const subject of user.subjects) {
                console.log(`  Processing subject: ${subject.name}`);

                // Check if folder already exists
                const existingFolder = await prisma.driveFolder.findFirst({
                    where: {
                        driveId: drive.id,
                        subjectId: subject.id,
                    },
                });

                let folder;
                if (!existingFolder) {
                    // Create folder for subject
                    folder = await prisma.driveFolder.create({
                        data: {
                            driveId: drive.id,
                            name: subject.name,
                            path: `/${subject.name}`,
                            subjectId: subject.id,
                            isPublic: false,
                        },
                    });
                    console.log(`    ✅ Created folder: ${subject.name}`);
                } else {
                    folder = existingFolder;
                    console.log(`    ✅ Folder already exists`);
                }

                // Migrate subject files to Drive
                let migratedCount = 0;
                for (const subjectFile of subject.files) {
                    // Check if file already exists in Drive
                    const existingDriveFile = await prisma.driveFile.findFirst({
                        where: {
                            folderId: folder.id,
                            storedName: subjectFile.storedName,
                        },
                    });

                    if (!existingDriveFile) {
                        // Create Drive file entry
                        await prisma.driveFile.create({
                            data: {
                                driveId: drive.id,
                                folderId: folder.id,
                                originalName: subjectFile.originalName,
                                storedName: subjectFile.storedName,
                                fileSize: subjectFile.fileSize,
                                mimeType: subjectFile.mimeType,
                                fileType: subjectFile.fileType,
                                fileHash: '', // Will be calculated on first access if needed
                                filePath: subjectFile.filePath,
                                thumbnailPath: subjectFile.thumbnailPath || null,
                                isPublic: subjectFile.isPublic,
                            },
                        });
                        migratedCount++;

                        // Update drive storage
                        await prisma.drive.update({
                            where: { id: drive.id },
                            data: {
                                storageUsed: {
                                    increment: subjectFile.fileSize,
                                },
                            },
                        });
                    }
                }

                if (migratedCount > 0) {
                    console.log(`    ✅ Migrated ${migratedCount} files`);
                } else {
                    console.log(`    ℹ️  No new files to migrate`);
                }
            }

            console.log(`✅ Completed user: ${user.name}\n`);
        }

        console.log('🎉 Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
migrateSubjectsToDrive()
    .then(() => {
        console.log('\n✅ All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Error:', error);
        process.exit(1);
    });
