import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createDriveFolderForSubject, syncSubjectFilesToDrive } from '@/lib/drive/subject-sync';

// POST - Create Drive folder for subject and sync files
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = (session.user as any).id;
        const body = await req.json();
        const { subjectId, subjectName } = body;

        // Create Drive folder for subject
        const folder = await createDriveFolderForSubject({
            userId,
            subjectId,
            subjectName,
        });

        // Sync existing subject files to Drive
        const syncResult = await syncSubjectFilesToDrive({
            userId,
            subjectId,
        });

        return NextResponse.json({
            folder,
            synced: syncResult.synced,
            total: syncResult.total,
        });
    } catch (error: any) {
        console.error('Error syncing subject to Drive:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to sync subject' },
            { status: 500 }
        );
    }
}
