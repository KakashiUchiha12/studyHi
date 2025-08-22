"use client"

import type React from "react"

import { useState } from "react"
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
  name: string
  description: string
  materials: string[]
  color: string
  progress: number
  totalChapters: number
  completedChapters: number
}

interface AddSubjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddSubject: (subject: Subject) => void
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

export function AddSubjectDialog({ open, onOpenChange, onAddSubject }: AddSubjectDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    totalChapters: "",
    color: "bg-primary",
  })
  const [materials, setMaterials] = useState<string[]>([])
  const [newMaterial, setNewMaterial] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) return

    const subject: Subject = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      materials,
      color: formData.color,
      progress: 0,
      totalChapters: Number.parseInt(formData.totalChapters) || 1,
      completedChapters: 0,
    }

    onAddSubject(subject)

    // Reset form
    setFormData({
      name: "",
      description: "",
      totalChapters: "",
      color: "bg-primary",
    })
    setMaterials([])
    setNewMaterial("")
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Subject</DialogTitle>
          <DialogDescription>Create a new subject to track your academic progress</DialogDescription>
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

          <div className="space-y-2">
            <Label htmlFor="chapters">Total Chapters</Label>
            <Input
              id="chapters"
              type="number"
              min="1"
              placeholder="e.g., 15"
              value={formData.totalChapters}
              onChange={(e) => setFormData({ ...formData, totalChapters: e.target.value })}
            />
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
            <Button type="submit">Add Subject</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
