"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"

interface Subject {
  id: string
  name: string
  description: string
  materials: string[]
  color: string
  progress: number
  totalChapters: number
  completedChapters: number
  createdAt: string
}

interface EditSubjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: Subject
  onEditSubject: (subject: Subject) => void
}

const colorOptions = [
  { name: "Primary", value: "bg-primary" },
  { name: "Accent", value: "bg-accent" },
  { name: "Chart 1", value: "bg-chart-1" },
  { name: "Chart 2", value: "bg-chart-2" },
  { name: "Chart 3", value: "bg-chart-3" },
  { name: "Chart 4", value: "bg-chart-4" },
  { name: "Chart 5", value: "bg-chart-5" },
]

export function EditSubjectDialog({ open, onOpenChange, subject, onEditSubject }: EditSubjectDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "bg-primary",
  })
  const [materials, setMaterials] = useState<string[]>([])
  const [newMaterial, setNewMaterial] = useState("")

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name,
        description: subject.description || '',
        color: subject.color,
      })
      setMaterials(subject.materials || [])
    }
  }, [subject])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) return

    const updatedSubject: Subject = {
      ...subject,
      name: formData.name.trim(),
      description: formData.description.trim(),
      materials,
      color: formData.color,
      // Keep existing chapter data - chapters are managed separately
      totalChapters: subject.totalChapters || 0,
      completedChapters: subject.completedChapters || 0,
      progress: subject.progress || 0,
    }

    onEditSubject(updatedSubject)
  }

  const addMaterial = () => {
    if (newMaterial.trim() && !materials.includes(newMaterial.trim())) {
      setMaterials([...materials, newMaterial.trim()])
      setNewMaterial("")
    }
  }

  const removeMaterial = (index: number) => {
    setMaterials(materials.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>Update your subject information. Chapters are managed in the subject details view.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Subject Name</Label>
            <Input
              id="name"
              placeholder="e.g., Mathematics, Physics, Chemistry"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the subject content"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">📚 Chapter Management</p>
              <p>Chapters are managed in the subject details view. Use the "View Details" button to add, edit, and track chapter progress.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color Theme</Label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`flex items-center space-x-2 rounded-md border px-3 py-2 text-sm ${
                    formData.color === color.value ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                  }`}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                >
                  <div className={`h-3 w-3 rounded-full ${color.value}`} />
                  <span>{color.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Study Materials</Label>
            <div className="flex space-x-2">
              <Input
                placeholder="Add study material (books, websites, etc.)"
                value={newMaterial}
                onChange={(e) => setNewMaterial(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addMaterial())}
              />
              <Button type="button" variant="outline" onClick={addMaterial}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {materials.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {materials.map((material, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {material}
                    <button type="button" onClick={() => removeMaterial(index)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
