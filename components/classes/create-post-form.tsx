"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  ImageIcon,
  Paperclip,
  X,
  FileText,
  Video,
  Loader2,
  AlertCircle
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface CreatePostFormProps {
  onSubmit: (postData: {
    type: string
    title?: string
    content: string
    attachments?: any[]
  }) => Promise<void>
  onCancel: () => void
  isTeacher: boolean
}

interface UploadingFile {
  name: string
  progress: number
}

export function CreatePostForm({ onSubmit, onCancel, isTeacher }: CreatePostFormProps) {
  const [type, setType] = useState("general")
  const [content, setContent] = useState("")
  const [attachments, setAttachments] = useState<any[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim() && attachments.length === 0) {
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        type,
        content: content.trim(),
        attachments,
      })

      setType("general")
      setContent("")
      setAttachments([])
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)

      for (const file of files) {
        setUploadingFiles(prev => [...prev, { name: file.name, progress: 0 }])

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => prev.map(f =>
            f.name === file.name ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
          ))
        }, 100)

        const formData = new FormData()
        formData.append("file", file)
        formData.append("subfolder", "class-posts")

        try {
          const res = await fetch("/api/upload", {
            method: "POST",
            body: formData
          })

          if (res.ok) {
            const data = await res.json()
            clearInterval(progressInterval)
            setUploadingFiles(prev => prev.filter(f => f.name !== file.name))

            let fileType = "file"
            if (file.type.startsWith("image/")) fileType = "image"
            else if (file.type.startsWith("video/")) fileType = "video"
            else if (file.type === "application/pdf") fileType = "pdf"

            setAttachments(prev => [...prev, {
              url: data.url,
              name: file.name,
              size: file.size,
              type: fileType
            }])
          }
        } catch (error) {
          console.error("Upload failed", error)
          clearInterval(progressInterval)
          setUploadingFiles(prev => prev.filter(f => f.name !== file.name))
        }
      }
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="Post Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="question">Question</SelectItem>
              {isTeacher && (
                <>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Share something with your class..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[100px] border-none focus-visible:ring-0 px-0 resize-none text-base bg-transparent"
        />

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex gap-2 overflow-x-auto py-2">
            {attachments.map((att, i) => (
              <div key={i} className="relative group shrink-0">
                {att.type === "image" ? (
                  <img src={att.url} alt="Attachment" className="h-20 w-20 object-cover rounded-md border" />
                ) : (
                  <div className="h-20 w-20 bg-muted flex flex-col items-center justify-center rounded-md border text-[10px] text-muted-foreground p-1 text-center truncate">
                    {att.type === "video" ? (
                      <Video className="h-6 w-6 mb-1 text-purple-500" />
                    ) : att.type === "pdf" ? (
                      <FileText className="h-6 w-6 mb-1 text-red-500" />
                    ) : (
                      <FileText className="h-6 w-6 mb-1 text-blue-500" />
                    )}
                    <span className="w-full truncate">{att.name}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm hover:opacity-90 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress */}
        {uploadingFiles.length > 0 && (
          <div className="space-y-2 py-2">
            {uploadingFiles.map((file, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="truncate flex-1 mr-2">Uploading {file.name}...</span>
                  <span>{file.progress}%</span>
                </div>
                <Progress value={file.progress} className="h-1" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center border-t pt-3">
        <div className="flex items-center gap-1">
          <input
            type="file"
            id="class-media-upload"
            multiple
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
          <input
            type="file"
            id="class-attachment-upload"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2 h-8 px-2"
            onClick={() => document.getElementById('class-media-upload')?.click()}
          >
            <ImageIcon className="w-4 h-4 text-emerald-500" />
            <span className="text-xs hidden md:inline">Media</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2 h-8 px-2"
            onClick={() => document.getElementById('class-attachment-upload')?.click()}
          >
            <Paperclip className="w-4 h-4 text-blue-500" />
            <span className="text-xs hidden md:inline">File</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || (!content.trim() && attachments.length === 0) || uploadingFiles.length > 0}
            className="h-8"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              "Post"
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
