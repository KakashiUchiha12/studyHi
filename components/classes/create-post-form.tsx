"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CreatePostFormProps {
  onSubmit: (postData: {
    type: string
    title?: string
    content: string
    attachments?: string[]
  }) => Promise<void>
  onCancel: () => void
  isTeacher: boolean
}

export function CreatePostForm({ onSubmit, onCancel, isTeacher }: CreatePostFormProps) {
  const [type, setType] = useState("general")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) {
      return
    }

    setLoading(true)
    try {
      await onSubmit({
        type,
        title: title.trim() || undefined,
        content: content.trim(),
      })
      
      setType("general")
      setTitle("")
      setContent("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Post Type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue />
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

      <div className="space-y-2">
        <Label htmlFor="title">Title (Optional)</Label>
        <Input
          id="title"
          placeholder="Post title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          placeholder="What would you like to share?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !content.trim()}>
          {loading ? "Posting..." : "Post"}
        </Button>
      </div>
    </form>
  )
}
