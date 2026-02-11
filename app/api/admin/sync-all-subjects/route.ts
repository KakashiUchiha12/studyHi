import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createDriveFolderForSubject, syncSubjectFilesToDrive } from '@/lib/drive/subject-sync';

export const dynamic = 'force-dynamic'; // Prevent static generation

export async function GET(req: NextRequest) {
    try {
        // Security: In a real app, check for Admin role. 
        // For this debugging session, we assume the caller knows the URL.
        // Or check a query param secret? ?secret=studyhi_admin_sync
        const { searchParams } = new URL(req.url);
        if (searchParams.get('secret') !== 'studyhi_admin_sync') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const users = await prisma.user.findMany({
            include: {
                subjects: true,
                drive: true
            }
        });

        const results = [];

        for (const user of users) {
            if (!user.drive) continue;

            for (const subject of user.subjects) {
                // 1. Ensure Folder Exists
                const folderName = `Subjects - ${subject.name}`;
                let folder = await prisma.driveFolder.findFirst({
                    where: {
                        driveId: user.drive.id,
                        subjectId: subject.id,
                        deletedAt: null
                    }
                });

                if (!folder) {
                    try {
                        folder = await createDriveFolderForSubject({
                            userId: user.id,
                            subjectId: subject.id,
                            subjectName: subject.name
                        });
                        results.push(`Created folder for ${user.name} - ${subject.name}`);
                    } catch (e) {
                        console.error(`Failed to create folder for ${subject.name}`, e);
                        continue;
                    }
                }

                // 2. Sync Files
                try {
                    const syncValues = await syncSubjectFilesToDrive({
                        userId: user.id,
                        subjectId: subject.id
                    });
                    if (syncValues.synced > 0) {
                        results.push(`Synced ${syncValues.synced} files for ${user.name} - ${subject.name}`);
                    }
                } catch (e) {
                    console.error(`Failed to sync files for ${subject.name}`, e);
                }
            }
        }

        return NextResponse.json({
            message: 'Sync process completed',
            details: results
        });

    } catch (error: any) {
        console.error('Fatal error in sync-all-subjects:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Error' },
            { status: 500 }
        );
    }
}
