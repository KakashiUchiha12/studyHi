import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        await prisma.post.update({
            where: { id: params.id },
            data: { viewCount: { increment: 1 } }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[POST_VIEW_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
