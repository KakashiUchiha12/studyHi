"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Heart, Share2, Edit, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface ProjectActionsProps {
    projectId: string
    isLiked: boolean
    likeCount: number
    isAuthor: boolean
}

export function ProjectActions({
    projectId,
    isLiked: initialIsLiked,
    likeCount: initialLikeCount,
    isAuthor,
}: ProjectActionsProps) {
    const router = useRouter()
    const [isLiked, setIsLiked] = useState(initialIsLiked)
    const [likeCount, setLikeCount] = useState(initialLikeCount)
    const [loading, setLoading] = useState(false)

    const handleLike = async () => {
        try {
            const response = await fetch(`/api/projects/${projectId}/like`, {
                method: "POST",
            })

            if (!response.ok) throw new Error("Failed to like project")

            const data = await response.json()
            setIsLiked(data.liked)
            setLikeCount((prev) => (data.liked ? prev + 1 : prev - 1))
        } catch (error) {
            toast.error("Failed to update like")
        }
    }

    const handleShare = async () => {
        const url = `${window.location.origin}/projects/${projectId}`

        if (navigator.share) {
            try {
                await navigator.share({ url })
            } catch (error) {
                // User cancelled or error occurred
            }
        } else {
            await navigator.clipboard.writeText(url)
            toast.success("Link copied to clipboard!")
        }
    }

    const handleDelete = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/projects/${projectId}`, {
                method: "DELETE",
            })

            if (!response.ok) throw new Error("Failed to delete project")

            toast.success("Project deleted successfully")
            router.push("/projects")
            router.refresh()
        } catch (error) {
            toast.error("Failed to delete project")
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                variant={isLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                className="gap-2"
            >
                <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                <span>{likeCount}</span>
            </Button>

            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
            </Button>

            {isAuthor && (
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/projects/${projectId}/edit`)}
                        className="gap-2"
                    >
                        <Edit className="h-4 w-4" />
                        Edit
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 text-destructive">
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete your
                                    project and all its content.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    disabled={loading}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </div>
    )
}
