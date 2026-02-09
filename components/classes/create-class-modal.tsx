"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface CreateClassModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateClass: (classData: {
    name: string
    description: string
    coverImage: string
    icon?: string
    bannerImage?: string
    syllabus?: string
    allowStudentPosts?: boolean
    allowComments?: boolean
  }) => Promise<void>
}

const COVER_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Amber', value: '#F59E0B' },
]

export function CreateClassModal({
  open,
  onOpenChange,
  onCreateClass,
}: CreateClassModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [syllabus, setSyllabus] = useState("")
  const [coverImage, setCoverImage] = useState("#3B82F6")
  const [icon, setIcon] = useState("")
  const [bannerImage, setBannerImage] = useState("")
  const [allowStudentPosts, setAllowStudentPosts] = useState(true)
  const [allowComments, setAllowComments] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      return
    }

    setLoading(true)
    try {
      await onCreateClass({
        name: name.trim(),
        description: description.trim(),
        coverImage,
        icon: icon.trim() || undefined,
        bannerImage: bannerImage.trim() || undefined,
        syllabus: syllabus.trim() || undefined,
        allowStudentPosts,
        allowComments,
      })

      setName("")
      setDescription("")
      setSyllabus("")
      setIcon("")
      setBannerImage("")
      setCoverImage("#3B82F6")
      setAllowStudentPosts(true)
      setAllowComments(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Create a new class to collaborate with students and share materials
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Class Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Mathematics 101"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the class..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="syllabus">Syllabus (Optional)</Label>
            <Textarea
              id="syllabus"
              placeholder="Course syllabus, objectives, grading policy..."
              value={syllabus}
              onChange={(e) => setSyllabus(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Class Icon URL (Optional)</Label>
              <Input
                id="icon"
                placeholder="https://..."
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banner">Banner Image URL (Optional)</Label>
              <Input
                id="banner"
                placeholder="https://..."
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cover Color (Fallback)</Label>
            <div className="flex gap-2">
              {COVER_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${coverImage === color.value
                    ? 'border-foreground scale-110'
                    : 'border-transparent hover:scale-105'
                    }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setCoverImage(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="studentPosts">Allow Student Posts</Label>
                <p className="text-xs text-muted-foreground">
                  Students can create posts in the class stream
                </p>
              </div>
              <Switch
                id="studentPosts"
                checked={allowStudentPosts}
                onCheckedChange={setAllowStudentPosts}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="comments">Allow Comments</Label>
                <p className="text-xs text-muted-foreground">
                  Members can comment on posts
                </p>
              </div>
              <Switch
                id="comments"
                checked={allowComments}
                onCheckedChange={setAllowComments}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Creating..." : "Create Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
