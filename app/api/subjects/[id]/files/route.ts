import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/subjects/[id]/files - Get all files and links associated with a subject
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: subjectId } = await params;

        // Fetch subject to ensure it exists
        const subject = await prisma.subject.findUnique({
            where: { id: subjectId },
            include: {
                files: true,
                materials: true,
            }
        });

        if (!subject) {
            return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
        }

        // Standardize all files from subject.files
        const files: any[] = subject.files.map(f => ({
            id: f.id,
            originalName: f.originalName,
            fileSize: f.fileSize,
            fileType: f.fileType,
            mimeType: f.mimeType,
            source: 'subject_file',
            isLink: false
        }));

        // Extract files and links from materials
        subject.materials.forEach(material => {
            if (material.content) {
                try {
                    const parsed = JSON.parse(material.content);
                    if (parsed.files && Array.isArray(parsed.files)) {
                        parsed.files.forEach((f: any) => {
                            // Avoid duplicates if same file ID exists
                            if (!files.find(existing => existing.id === f.id)) {
                                files.push({
                                    ...f,
                                    source: 'material_content',
                                    isLink: false
                                });
                            }
                        });
                    }
                    if (parsed.links && Array.isArray(parsed.links)) {
                        parsed.links.forEach((l: any) => {
                            files.push({
                                id: l.id,
                                originalName: l.description || l.url,
                                url: l.url,
                                isLink: true,
                                source: 'material_link'
                            });
                        });
                    }
                } catch (e) {
                    // Handle old format content: FILES:[...]
                    if (material.content?.startsWith('FILES:')) {
                        try {
                            const filesPart = material.content.substring(6);
                            let jsonEnd = filesPart.length;
                            for (let i = 0; i < filesPart.length; i++) {
                                if (filesPart[i] === '\n' || filesPart[i] === '\r') {
                                    jsonEnd = i;
                                    break;
                                }
                            }
                            const cleanJson = filesPart.substring(0, jsonEnd);
                            const parsedFiles = JSON.parse(cleanJson);
                            parsedFiles.forEach((f: any) => {
                                if (!files.find(existing => existing.id === f.id)) {
                                    files.push({
                                        ...f,
                                        source: 'material_content_old',
                                        isLink: false
                                    });
                                }
                            });
                        } catch (e2) {
                            console.error('Error parsing old format content in API:', e2);
                        }
                    }
                }
            } else if (material.fileUrl) {
                // Handle legacy single-file materials
                files.push({
                    id: material.id,
                    originalName: material.title,
                    url: material.fileUrl,
                    fileSize: material.fileSize || 0,
                    source: 'material_legacy',
                    isLink: material.type === 'LINK'
                });
            }
        });

        // Deduplicate by ID if needed
        const uniqueFiles = Array.from(new Map(files.map(f => [f.id, f])).values());

        return NextResponse.json({ files: uniqueFiles });
    } catch (error) {
        console.error("[SUBJECT_FILES_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
