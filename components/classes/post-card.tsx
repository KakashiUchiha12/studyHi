"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Heart, 
  MessageCircle, 
  Pin, 
  MoreVertical, 
  Trash2, 
  Edit,
  Megaphone,
  HelpCircle,
  FileText,
  MessageSquare
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ClassPost, ClassRole } from "@/types/classes"
import { PostComments } from "@/components/classes/post-comments"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface PostCardProps {
  post: ClassPost
  classId: string
  userRole: ClassRole | null
  allowComments: boolean
  onDelete: (postId: string) => void
  onTogglePin: (postId: string) => void
  onUpdate: () => void
}

const POST_TYPE_ICONS = {
  announcement: Megaphone,
  question: HelpCircle,
  material: FileText,
  general: MessageSquare,
}

const POST_TYPE_COLORS = {
  announcement: 'bg-blue-500/10 text-blue-500',
  question: 'bg-amber-500/10 text-amber-500',
  material: 'bg-green-500/10 text-green-500',
  general: 'bg-gray-500/10 text-gray-500',
}

export function PostCard({
  post,
  classId,
  userRole,
  allowComments,
  onDelete,
  onTogglePin,
  onUpdate,
}: PostCardProps) {
  const { data: session } = useSession()
  const [showComments, setShowComments] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0)

  const Icon = POST_TYPE_ICONS[post.type as keyof typeof POST_TYPE_ICONS] || MessageSquare
  const typeColor = POST_TYPE_COLORS[post.type as keyof typeof POST_TYPE_COLORS] || POST_TYPE_COLORS.general

  const isAuthor = session?.user && (session.user as any).id === post.authorId
  const isTeacherOrAdmin = userRole === 'admin' || userRole === 'teacher'
  const canEdit = isAuthor || isTeacherOrAdmin
  const canDelete = isAuthor || isTeacherOrAdmin
  const canPin = isTeacherOrAdmin

  const handleToggleLike = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}/posts/${post.id}/like`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to toggle like")
      }

      const data = await response.json()
      setLiked(data.liked)
      setLikeCount(prev => data.liked ? prev + 1 : prev - 1)
    } catch (error) {
      console.error("Failed to toggle like:", error)
      toast.error("Failed to toggle like")
    }
  }

  return (
    <Card className={post.pinned ? "border-primary" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.image || undefined} />
              <AvatarFallback>
                {post.author?.name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold">{post.author?.name || 'Unknown'}</p>
                <Badge variant="outline" className={`${typeColor} text-xs`}>
                  <Icon className="h-3 w-3 mr-1" />
                  {post.type}
                </Badge>
                {post.pinned && (
                  <Badge variant="secondary" className="text-xs">
                    <Pin className="h-3 w-3 mr-1" />
                    Pinned
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(post.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {(canEdit || canDelete || canPin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canPin && (
                  <DropdownMenuItem onClick={() => onTogglePin(post.id)}>
                    <Pin className="h-4 w-4 mr-2" />
                    {post.pinned ? 'Unpin' : 'Pin'} Post
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(post.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {post.title && (
          <h3 className="text-xl font-semibold">{post.title}</h3>
        )}
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>

        {post.attachments && post.attachments.length > 0 && (
          <div className="space-y-2">
            {post.attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-primary hover:underline"
              >
                📎 Attachment {index + 1}
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleLike}
            className={liked ? "text-red-500" : ""}
          >
            <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-current" : ""}`} />
            {likeCount}
          </Button>

          {allowComments && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              {post._count?.comments || 0}
            </Button>
          )}
        </div>

        {showComments && allowComments && (
          <PostComments
            classId={classId}
            postId={post.id}
            onUpdate={onUpdate}
          />
        )}
      </CardContent>
    </Card>
  )
}
