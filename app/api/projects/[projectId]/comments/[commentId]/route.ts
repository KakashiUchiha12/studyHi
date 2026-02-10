import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { deleteProjectComment } from "@/lib/projects/projectService"
import { prisma } from "@/lib/prisma"

export async function DELETE(
    req: Request,
    context: { params: Promise<{ projectId: string; commentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { commentId } = await context.params
        const userId = (session.user as any).id

        // Check if comment exists and belongs to user
        const comment = await prisma.projectComment.findUnique({
            where: { id: commentId },
            select: { userId: true },
        })

        if (!comment) {
            return NextResponse.json({ error: "Comment not found" }, { status: 404 })
        }

        if (comment.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        await deleteProjectComment(commentId)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("Error deleting comment:", error)
        return NextResponse.json(
            { error: "Failed to delete comment" },
            { status: 500 }
        )
    }
}
