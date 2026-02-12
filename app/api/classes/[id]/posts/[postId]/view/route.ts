import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string; postId: string }> }
) {
    const { postId } = await props.params;
    try {
        await prisma.classPost.update({
            where: { id: postId },
            data: { viewCount: { increment: 1 } }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[CLASS_POST_VIEW_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
