"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { ClassPost, ClassRole } from "@/types/classes"
import { PostCard } from "@/components/classes/post-card"
import { CreatePostForm } from "@/components/classes/create-post-form"
import { Skeleton } from "@/components/ui/skeleton"

interface StreamTabProps {
  classId: string
  userRole: ClassRole | null
  allowStudentPosts: boolean
  allowComments: boolean
}

export function StreamTab({ classId, userRole, allowStudentPosts, allowComments }: StreamTabProps) {
  const [posts, setPosts] = useState<ClassPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    loadPosts()
  }, [classId])

  const loadPosts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/classes/${classId}/posts`)
      
      if (!response.ok) {
        throw new Error("Failed to load posts")
      }

      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error("Failed to load posts:", error)
      toast.error("Failed to load posts")
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = async (postData: {
    type: string
    title?: string
    content: string
    attachments?: string[]
  }) => {
    try {
      const response = await fetch(`/api/classes/${classId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        throw new Error("Failed to create post")
      }

      toast.success("Post created successfully!")
      setShowCreateForm(false)
      loadPosts()
    } catch (error) {
      console.error("Failed to create post:", error)
      toast.error("Failed to create post")
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return
    }

    try {
      const response = await fetch(`/api/classes/${classId}/posts/${postId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete post")
      }

      toast.success("Post deleted successfully!")
      loadPosts()
    } catch (error) {
      console.error("Failed to delete post:", error)
      toast.error("Failed to delete post")
    }
  }

  const handleTogglePin = async (postId: string) => {
    try {
      const response = await fetch(`/api/classes/${classId}/posts/${postId}/pin`, {
        method: "PUT",
      })

      if (!response.ok) {
        throw new Error("Failed to toggle pin")
      }

      toast.success("Post pin status updated!")
      loadPosts()
    } catch (error) {
      console.error("Failed to toggle pin:", error)
      toast.error("Failed to toggle pin")
    }
  }

  const canCreatePost = 
    userRole === 'admin' || 
    userRole === 'teacher' || 
    (userRole === 'student' && allowStudentPosts)

  const isTeacherOrAdmin = userRole === 'admin' || userRole === 'teacher'

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {canCreatePost && (
        <div className="bg-card border rounded-lg p-4">
          {showCreateForm ? (
            <CreatePostForm
              onSubmit={handleCreatePost}
              onCancel={() => setShowCreateForm(false)}
              isTeacher={isTeacherOrAdmin}
            />
          ) : (
            <Button onClick={() => setShowCreateForm(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          )}
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              classId={classId}
              userRole={userRole}
              allowComments={allowComments}
              onDelete={handleDeletePost}
              onTogglePin={handleTogglePin}
              onUpdate={loadPosts}
            />
          ))}
        </div>
      )}
    </div>
  )
}
