"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Heart,
  Pin,
  MoreHorizontal,
  Trash2,
  Megaphone,
  HelpCircle,
  FileText,
  MessageSquare,
  Share2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Video,
  Loader2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ClassPost, ClassRole } from "@/types/classes"
import { PostComments } from "@/components/classes/post-comments"
import { ImageViewer } from "@/components/ui/image-viewer"
import { FilePreview } from "@/components/file-preview"
import { toast } from "sonner"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
  assignment: FileText,
}

const POST_TYPE_COLORS = {
  announcement: 'bg-blue-500/10 text-blue-500',
  question: 'bg-amber-500/10 text-amber-500',
  material: 'bg-green-500/10 text-green-500',
  general: 'bg-gray-500/10 text-gray-500',
  assignment: 'bg-purple-500/10 text-purple-500',
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
  const [liked, setLiked] = useState((post as any).isLiked || false)
  const [likeCount, setLikeCount] = useState(post._count?.likes || 0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [isSavingInProgress, setIsSavingInProgress] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)

  const Icon = POST_TYPE_ICONS[post.type as keyof typeof POST_TYPE_ICONS] || MessageSquare
  const typeColor = POST_TYPE_COLORS[post.type as keyof typeof POST_TYPE_COLORS] || POST_TYPE_COLORS.general

  const isAuthor = session?.user && (session.user as any).id === post.authorId
  const isTeacherOrAdmin = userRole === 'admin' || userRole === 'teacher'
  const canDelete = isAuthor || isTeacherOrAdmin
  const canPin = isTeacherOrAdmin

  useEffect(() => {
    setLiked((post as any).isLiked || false)
    setLikeCount(post._count?.likes || 0)
  }, [post])

  const handleToggleLike = async () => {
    // Optimistic update
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount(prev => newLiked ? prev + 1 : prev - 1)

    try {
      const response = await fetch(`/api/classes/${classId}/posts/${post.id}/like`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to toggle like")
      }
      // Status already updated optimistically, but we could sync with server response if needed
    } catch (error) {
      console.error("Failed to toggle like:", error)
      toast.error("Failed to toggle like")
      // Revert optimism
      setLiked(!newLiked)
      setLikeCount(prev => !newLiked ? prev + 1 : prev - 1)
    }
  }

  const handleSaveToDrive = async (att: any) => {
    try {
      setIsSavingInProgress(typeof att === 'string' ? att : att.url)
      const url = typeof att === 'string' ? att : att.url
      const name = typeof att === 'string' ? url.split('/').pop() : att.name

      const response = await fetch('/api/drive/save-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url,
          name: name || "downloaded-file"
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save to Drive')
      }

      toast.success("Saved to Drive successfully")
    } catch (e: any) {
      console.error("Save to Drive failed", e)
      toast.error(e.message || 'Failed to save file to Drive.')
    } finally {
      setIsSavingInProgress(null)
    }
  }

  const handlePreview = (attachment: any) => {
    const url = typeof attachment === 'string' ? attachment : attachment.url
    const name = typeof attachment === 'string' ? url.split('/').pop() : attachment.name
    const size = typeof attachment === 'string' ? 0 : (attachment.size || 0)
    const isPDF = url.toLowerCase().includes('.pdf') || attachment.type === 'pdf'

    setSelectedFile({
      id: url,
      name: name || "Attachment",
      url: url,
      size: size,
      type: isPDF ? 'application/pdf' : 'application/octet-stream'
    })
    setIsPreviewOpen(true)
  }

  // Handle both string arrays and object arrays for attachments
  const attachments = post.attachments || []
  const mediaAttachments = attachments.filter((att: any) => {
    const url = typeof att === 'string' ? att : att.url
    return url.match(/\.(jpeg|jpg|gif|png|webp)/i) || att.type === 'image'
  }).map((att: any) => typeof att === 'string' ? { url: att, type: 'image' } : att)

  const fileAttachments = attachments.filter((att: any) => {
    const url = typeof att === 'string' ? att : att.url
    return !url.match(/\.(jpeg|jpg|gif|png|webp)/i) && att.type !== 'image'
  }).map((att: any) => typeof att === 'string' ? { url: att, type: 'file', name: att.split('/').pop() } : att)

  return (
    <Card className={cn(
      "mb-2 sm:mb-4 rounded-none sm:rounded-xl border-x-0 sm:border-x",
      post.pinned && "border-primary/50 shadow-sm"
    )}>
      <CardHeader className="flex flex-row items-center gap-4 p-4 pb-2">
        <Link href={`/profile/${post.authorId}`}>
          <Avatar className="h-10 w-10 hover:opacity-80 transition-opacity">
            <AvatarImage src={post.author?.image || undefined} />
            <AvatarFallback>
              {post.author?.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/profile/${post.authorId}`} className="font-semibold hover:underline truncate">
              {post.author?.name || 'Unknown'}
            </Link>
            <Badge variant="outline" className={cn("text-[10px] h-5", typeColor)}>
              <Icon className="h-3 w-3 mr-1" />
              {post.type.toUpperCase()}
            </Badge>
            {post.pinned && (
              <Badge variant="secondary" className="text-[10px] h-5 bg-primary/10 text-primary">
                <Pin className="h-2.5 w-2.5 mr-1" />
                PINNED
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </span>
        </div>

        <div className="ml-auto">
          {(canDelete || canPin) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {canPin && (
                  <DropdownMenuItem onClick={() => onTogglePin(post.id)}>
                    <Pin className="h-4 w-4 mr-2" />
                    {post.pinned ? 'Unpin Post' : 'Pin to Top'}
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(post.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Post
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 py-2 space-y-3">
        {post.title && (
          <h3 className="text-lg font-bold leading-tight">{post.title}</h3>
        )}
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>

        {/* Image Gallery */}
        {mediaAttachments.length > 0 && (
          <div className="relative group overflow-hidden rounded-md bg-muted/30 border flex flex-col mt-3">
            <div
              className="w-full flex transition-transform duration-300 ease-out cursor-pointer"
              style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
              onClick={() => setIsViewerOpen(true)}
            >
              {mediaAttachments.map((att: any, index: number) => (
                <div key={index} className="min-w-full relative flex items-center justify-center bg-black/5">
                  <img
                    src={att.url}
                    alt={`Post image ${index + 1}`}
                    className="max-h-[500px] w-full object-contain"
                  />
                </div>
              ))}
            </div>

            {mediaAttachments.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentImageIndex(prev => prev === 0 ? mediaAttachments.length - 1 : prev - 1)
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentImageIndex(prev => prev === mediaAttachments.length - 1 ? 0 : prev + 1)
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {mediaAttachments.map((_: any, i: number) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* File Attachments */}
        {fileAttachments.length > 0 && (
          <div className="space-y-2 mt-3">
            {fileAttachments.map((att: any, index: number) => {
              const url = typeof att === 'string' ? att : att.url
              const name = typeof att === 'string' ? url.split('/').pop() : att.name
              const isPDF = url.toLowerCase().includes('.pdf') || att.type === 'pdf'

              return (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault()
                    handlePreview(att)
                  }}
                  disabled={!!isSavingInProgress}
                  className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors border text-left group disabled:opacity-50"
                >
                  <div className="bg-background rounded-md shadow-sm group-hover:bg-accent transition-colors h-14 w-14 flex items-center justify-center shrink-0">
                    {isPDF ? (
                      <img
                        src={`/api/media/thumbnail?url=${encodeURIComponent(url)}`}
                        alt={name}
                        className="h-full w-full object-cover rounded-md"
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                          (e.target as any).nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={cn("items-center justify-center w-full h-full", isPDF ? "hidden" : "flex")}>
                      {att.type === 'video' ? (
                        <Video className="w-6 h-6 text-purple-500" />
                      ) : (
                        <FileText className="w-6 h-6 text-blue-500" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate">{name || "Attached File"}</p>
                    <p className="text-xs text-muted-foreground">{isPDF ? 'PDF Document' : 'Class Resource'}</p>
                  </div>
                  {isSavingInProgress === (typeof att === 'string' ? att : att.url) ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <div className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/5 px-2 py-1 rounded-full group-hover:bg-primary/10 shrink-0">
                      <span className="hidden sm:inline">Save to Drive</span>
                      <Download className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-2 flex flex-col items-stretch">
        <div className="flex items-center justify-between w-full border-t pt-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn("flex-1 gap-2 rounded-lg", liked && "text-red-500 hover:text-red-600 hover:bg-red-50")}
            onClick={handleToggleLike}
          >
            <Heart className={cn("w-4 h-4", liked && "fill-current")} />
            {likeCount > 0 && <span className="text-xs font-semibold">{likeCount}</span>}
            <span className="hidden sm:inline text-xs">Like</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className={cn("flex-1 gap-2 rounded-lg", showComments && "bg-accent/50")}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="w-4 h-4" />
            {(post._count?.comments || 0) > 0 && <span className="text-xs font-semibold">{post._count.comments}</span>}
            <span className="hidden sm:inline text-xs">Comment</span>
          </Button>

          <Button variant="ghost" size="sm" className="flex-1 gap-2 rounded-lg">
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Share</span>
          </Button>
        </div>

        {showComments && (
          <div className="w-full mt-2">
            <PostComments
              classId={classId}
              postId={post.id}
              onUpdate={onUpdate}
            />
          </div>
        )}
      </CardFooter>

      <ImageViewer
        images={mediaAttachments.map(m => m.url)}
        initialIndex={currentImageIndex}
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
      />
      {selectedFile && (
        <FilePreview
          file={selectedFile}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </Card>
  )
}
