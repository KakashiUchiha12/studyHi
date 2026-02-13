"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"

interface Comment {
    id: string
    content: string
    createdAt: Date | string
    user: {
        id: string
        name: string | null
        image: string | null
        username: string | null
    }
}

interface ProjectCommentsProps {
    projectId: string
    initialComments: Comment[]
    currentUserId?: string
}

export function ProjectComments({
    projectId,
    initialComments,
    currentUserId,
}: ProjectCommentsProps) {
    const router = useRouter()
    const [comments, setComments] = useState(initialComments)
    const [newComment, setNewComment] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newComment.trim()) return

        setLoading(true)
        try {
            const response = await fetch(`/api/projects/${projectId}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newComment }),
            })

            if (!response.ok) throw new Error("Failed to post comment")

            const comment = await response.json()
            setComments([comment, ...comments])
            setNewComment("")
            toast.success("Comment posted!")
            router.refresh()
        } catch (error) {
            toast.error("Failed to post comment")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (commentId: string) => {
        try {
            const response = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
                method: "DELETE",
            })

            if (!response.ok) throw new Error("Failed to delete comment")

            setComments(comments.filter((c) => c.id !== commentId))
            toast.success("Comment deleted")
            router.refresh()
        } catch (error) {
            toast.error("Failed to delete comment")
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Comments ({comments.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {currentUserId && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            rows={3}
                        />
                        <Button type="submit" disabled={loading || !newComment.trim()}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Post Comment
                        </Button>
                    </form>
                )}

                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No comments yet. Be the first to comment!
                        </p>
                    ) : (
                        comments.map((comment) => {
                            const createdAt =
                                typeof comment.createdAt === "string"
                                    ? new Date(comment.createdAt)
                                    : comment.createdAt

                            return (
                                <div key={comment.id} className="flex gap-4">
                                    <Link href={`/profile/${comment.user.username || comment.user.id}`}>
                                        <Avatar className="h-10 w-10 hover:opacity-80 transition-opacity">
                                            <AvatarImage
                                                src={comment.user.image || undefined}
                                                alt={comment.user.name || "User"}
                                            />
                                            <AvatarFallback>
                                                {comment.user.name?.charAt(0).toUpperCase() || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Link>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/profile/${comment.user.username || comment.user.id}`}
                                                    className="font-semibold text-sm hover:underline"
                                                >
                                                    {comment.user.name || "Anonymous"}
                                                </Link>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(createdAt, { addSuffix: true })}
                                                </span>
                                            </div>

                                            {currentUserId === comment.user.id && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(comment.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </div>

                                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
