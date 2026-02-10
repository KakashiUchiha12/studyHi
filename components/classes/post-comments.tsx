"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PostComment } from "@/types/classes"
import { toast } from "sonner"
import { Send, MoreHorizontal } from "lucide-react"

interface PostCommentsProps {
  classId: string
  postId: string
  onUpdate: () => void
}

export function PostComments({ classId, postId, onUpdate }: PostCommentsProps) {
  const [comments, setComments] = useState<PostComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadComments()
  }, [classId, postId])

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}/posts/${postId}/comments`)

      if (!response.ok) {
        throw new Error("Failed to load comments")
      }

      const data = await response.json()
      setComments(data)
    } catch (error) {
      console.error("Failed to load comments:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/classes/${classId}/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (!response.ok) {
        throw new Error("Failed to post comment")
      }

      setNewComment("")
      loadComments()
      onUpdate()
    } catch (error) {
      console.error("Failed to post comment:", error)
      toast.error("Failed to post comment")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 text-sm group">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={comment.author?.image || undefined} />
              <AvatarFallback>
                {comment.author?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between group/bubble">
                <div className="bg-muted px-3 py-2 rounded-2xl flex-1 max-w-fit">
                  <div className="flex items-center justify-between gap-4 mb-0.5">
                    <p className="text-xs font-bold leading-none">{comment.author?.name || 'Unknown'}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm leading-snug">{comment.content}</p>
                </div>

                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-2 italic">
            No comments yet. Start the conversation!
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 items-center pt-2">
        <Input
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="h-9 text-sm rounded-full bg-muted/50 focus-visible:ring-1 border-none"
        />
        <Button
          type="submit"
          disabled={loading || !newComment.trim()}
          size="icon"
          className="h-8 w-8 rounded-full shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
