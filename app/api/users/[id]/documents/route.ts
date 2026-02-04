import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const [driveFiles, subjectFiles] = await Promise.all([
            prisma.driveFile.findMany({
                where: {
                    drive: { userId: params.id },
                    OR: [
                        { isPublic: true },
                        { NOT: { mimeType: 'application/pdf' } }
                    ],
                    deletedAt: null
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            }),
            prisma.subjectFile.findMany({
                where: {
                    userId: params.id,
                    OR: [
                        { isPublic: true },
                        { NOT: { mimeType: 'application/pdf' } }
                    ]
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            })
        ]);

        // Standardize and merge
        const allDocs = [
            ...driveFiles.map(f => ({
                id: f.id,
                originalName: f.originalName,
                fileSize: f.fileSize.toString(),
                fileType: f.fileType,
                mimeType: f.mimeType,
                downloadCount: f.downloadCount,
                createdAt: f.createdAt,
                thumbnailUrl: `/api/drive/files/${f.id}?thumbnail=true`,
                downloadUrl: `/api/drive/files/${f.id}`,
                isSubjectFile: false
            })),
            ...subjectFiles.map(f => ({
                id: f.id,
                originalName: f.originalName,
                fileSize: f.fileSize.toString(),
                fileType: f.fileType,
                mimeType: f.mimeType,
                downloadCount: f.downloadCount,
                createdAt: f.createdAt,
                // Subject files that are synced to drive should ideally use the drive API
                // For now, if we don't have a direct Subject API, we use a placeholder or proxy
                thumbnailUrl: `/api/drive/files/${f.id}?thumbnail=true`, // This might fail if ID is not in driveFile
                downloadUrl: `/api/drive/files/${f.id}`,
                isSubjectFile: true
            }))
        ];

        // Deduplicate by originalName and fileSize to avoid showing both synced copies
        const seen = new Set();
        const deduplicated = allDocs.filter(doc => {
            const key = `${doc.originalName}-${doc.fileSize}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 20);

        return NextResponse.json({ documents: deduplicated });
    } catch (error) {
        console.error("[USER_DOCUMENTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
