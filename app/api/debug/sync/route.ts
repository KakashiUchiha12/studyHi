
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncSubjectFilesToDrive } from '@/lib/drive/subject-sync';

export async function GET(request: NextRequest) {
    const subjectName = "Operating Systems"; // Adjust if needed
    console.log(`[DEBUG] Starting manual sync for subject: ${subjectName}`);

    try {
        const subject = await prisma.subject.findFirst({
            where: { name: subjectName },
            include: { materials: true }
        });

        if (!subject) {
            console.error(`[DEBUG] Subject "${subjectName}" not found`);
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }

        console.log(`[DEBUG] Found subject: ${subject.name} (${subject.id})`);
        console.log(`[DEBUG] Materials count: ${subject.materials.length}`);

        subject.materials.forEach(m => {
            console.log(`[DEBUG] Material: ${m.title} (${m.id})`);
            console.log(`[DEBUG] Content preview: ${m.content?.substring(0, 100)}`);
        });

        const result = await syncSubjectFilesToDrive({
            userId: subject.userId,
            subjectId: subject.id
        });

        console.log("[DEBUG] Sync result:", result);

        // Debug: List folders and files
        // Check for multiple drives
        const allDrives = await prisma.drive.findMany({
            where: { userId: subject.userId }
        });
        console.log(`[DEBUG] User has ${allDrives.length} drives:`, allDrives);

        // Debug: List folders and files
        const driveFolders = await prisma.driveFolder.findMany({
            where: {
                driveId: { in: allDrives.map(d => d.id) }
            },
            include: { files: true }
        });

        // Filter for this user's drive if possible, or just log all relevant ones
        const userFollows = driveFolders.filter(f => f.name.includes("Operating") || f.name.includes("Books"));

        console.log("[DEBUG] Relevant Drive Folders found:", userFollows.map(f => ({
            id: f.id,
            name: f.name,
            parentId: f.parentId,
            path: f.path,
            fileCount: f.files.length,
            fileNames: f.files.map(fi => fi.originalName),
            deletedAt: f.deletedAt
        })));

        // Manual serialization to handle BigInt
        const safeFolders = userFollows.map(f => ({
            ...f,
            files: f.files.map(fi => ({
                ...fi,
                fileSize: fi.fileSize.toString()
            }))
        }));

        return NextResponse.json({ success: true, result, folders: safeFolders });
    } catch (e) {
        console.error("[DEBUG] Sync failed:", e);
        return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
    }
}
