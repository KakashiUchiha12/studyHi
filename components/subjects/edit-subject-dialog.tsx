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
import { X, Plus, Loader2 } from "lucide-react"

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
  code?: string
  credits?: number
  instructor?: string
  nextExam?: string
  assignmentsDue?: number
}

interface EditSubjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: Subject
  onEditSubject: (subject: Subject) => void
}

const colorOptions = [
  { name: "Primary", value: "bg-primary", hex: "#3B82F6" },
  { name: "Accent", value: "bg-accent", hex: "#8B5CF6" },
  { name: "Chart 1", value: "bg-chart-1", hex: "#10B981" },
  { name: "Chart 2", value: "bg-chart-2", hex: "#F59E0B" },
  { name: "Chart 3", value: "bg-chart-3", hex: "#EF4444" },
  { name: "Chart 4", value: "bg-chart-4", hex: "#EC4899" },
  { name: "Chart 5", value: "bg-chart-5", hex: "#14B8A6" },
]

export function EditSubjectDialog({ open, onOpenChange, subject, onEditSubject }: EditSubjectDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "bg-primary",
    code: "",
    credits: "",
    instructor: "",
    nextExam: "",
    assignmentsDue: "",
  })
  const [materials, setMaterials] = useState<string[]>([])
  const [newMaterial, setNewMaterial] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const LIMITS = {
    name: 50,
    description: 500,
    code: 20,
    instructor: 100,
  }

  useEffect(() => {
    if (subject) {
      setFormData({
        name: subject.name,
        description: subject.description || '',
        color: subject.color,
        code: subject.code || '',
        credits: subject.credits?.toString() || '',
        instructor: subject.instructor || '',
        nextExam: subject.nextExam ? new Date(subject.nextExam).toISOString().split('T')[0] : '',
        assignmentsDue: subject.assignmentsDue?.toString() || '',
      })
      setMaterials(subject.materials || [])
    }
  }, [subject])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) return
    if (formData.name.length > LIMITS.name) return
    if (formData.description.length > LIMITS.description) return
    if (formData.code.length > LIMITS.code) return
    if (formData.instructor.length > LIMITS.instructor) return

    setIsSubmitting(true)

    try {
      const updatedSubject: Subject = {
        ...subject,
        name: formData.name.trim(),
        description: formData.description.trim(),
        materials,
        color: formData.color,
        code: formData.code.trim(),
        credits: Number.parseInt(formData.credits) || 3,
        instructor: formData.instructor.trim(),
        nextExam: formData.nextExam || '',
        assignmentsDue: Number.parseInt(formData.assignmentsDue) || 0,
        // Keep existing chapter data - chapters are managed separately
        totalChapters: subject.totalChapters || 0,
        completedChapters: subject.completedChapters || 0,
        progress: subject.progress || 0,
      }

      await (onEditSubject as any)(updatedSubject)
    } finally {
      setIsSubmitting(false)
    }
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
            <div className="flex justify-between items-center">
              <Label htmlFor="name">Subject Name</Label>
              <span className={`text-[10px] ${formData.name.length > LIMITS.name ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                {formData.name.length}/{LIMITS.name}
              </span>
            </div>
            <Input
              id="name"
              placeholder="e.g., Mathematics, Physics, Chemistry"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.slice(0, LIMITS.name + 10) })}
              className={formData.name.length > LIMITS.name ? 'border-destructive ring-destructive/20' : ''}
              required
            />
            {formData.name.length > LIMITS.name && (
              <p className="text-[10px] text-destructive font-medium italic">Name is too long (max {LIMITS.name})</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="description">Description (Optional)</Label>
              <span className={`text-[10px] ${formData.description.length > LIMITS.description ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                {formData.description.length}/{LIMITS.description}
              </span>
            </div>
            <Textarea
              id="description"
              placeholder="Brief description of the subject content"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, LIMITS.description + 50) })}
              className={formData.description.length > LIMITS.description ? 'border-destructive ring-destructive/20' : ''}
              rows={3}
            />
            {formData.description.length > LIMITS.description && (
              <p className="text-[10px] text-destructive font-medium italic">Description is too long (max {LIMITS.description})</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="code">Subject Code</Label>
                <span className={`text-[10px] ${formData.code.length > LIMITS.code ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                  {formData.code.length}/{LIMITS.code}
                </span>
              </div>
              <Input
                id="code"
                placeholder="e.g., CS101, MATH201"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.slice(0, LIMITS.code + 5) })}
                className={formData.code.length > LIMITS.code ? 'border-destructive ring-destructive/20' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credits">Credit Hours</Label>
              <Input
                id="credits"
                type="number"
                min="1"
                max="6"
                placeholder="e.g., 3"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="instructor">Instructor</Label>
              <span className={`text-[10px] ${formData.instructor.length > LIMITS.instructor ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                {formData.instructor.length}/{LIMITS.instructor}
              </span>
            </div>
            <Input
              id="instructor"
              placeholder="e.g., Dr. Smith, Prof. Johnson"
              value={formData.instructor}
              onChange={(e) => setFormData({ ...formData, instructor: e.target.value.slice(0, LIMITS.instructor + 10) })}
              className={formData.instructor.length > LIMITS.instructor ? 'border-destructive ring-destructive/20' : ''}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextExam">Next Exam Date</Label>
              <Input
                id="nextExam"
                type="date"
                value={formData.nextExam}
                onChange={(e) => setFormData({ ...formData, nextExam: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignmentsDue">Assignments Due</Label>
              <Input
                id="assignmentsDue"
                type="number"
                min="0"
                placeholder="e.g., 2"
                value={formData.assignmentsDue}
                onChange={(e) => setFormData({ ...formData, assignmentsDue: e.target.value })}
              />
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">📚 Chapter Management</p>
              <p>Chapters are managed in the subject details view. Use the "View Details" button to add, edit, and track chapter progress.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color Theme</Label>
            <div className="grid grid-cols-7 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === color.value
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                    }`}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  title={color.name}
                >
                  <span className="sr-only">{color.name}</span>
                </button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Selected: {colorOptions.find(c => c.value === formData.color)?.name}
            </p>
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

          <DialogFooter className="pt-4 border-t gap-2 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.name.trim() ||
                formData.name.length > LIMITS.name ||
                formData.description.length > LIMITS.description ||
                formData.code.length > LIMITS.code ||
                formData.instructor.length > LIMITS.instructor
              }
              className="relative"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
