import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const subjects = await prisma.subject.findMany({
            where: {
                userId: params.id,
            },
            orderBy: { order: 'asc' },
            include: {
                _count: {
                    select: {
                        chapters: true,
                        files: true
                    }
                }
            }
        });

        return NextResponse.json({ subjects });
    } catch (error) {
        console.error("[USER_SUBJECTS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
