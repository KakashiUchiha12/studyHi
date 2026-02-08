"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { PostComment } from "@/types/classes"
import { toast } from "sonner"

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
    <div className="space-y-4 pt-4 border-t">
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.author?.image || undefined} />
              <AvatarFallback>
                {comment.author?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-muted rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold">{comment.author?.name || 'Unknown'}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </p>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={2}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !newComment.trim()} size="sm">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
