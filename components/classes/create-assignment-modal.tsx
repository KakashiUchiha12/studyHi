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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

interface CreateAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateAssignment: (assignmentData: {
    title: string
    description: string
    dueDate: string
    allowLateSubmission: boolean
  }) => Promise<void>
}

export function CreateAssignmentModal({
  open,
  onOpenChange,
  onCreateAssignment,
}: CreateAssignmentModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date>()
  const [dueTime, setDueTime] = useState("23:59")
  const [allowLateSubmission, setAllowLateSubmission] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !description.trim() || !dueDate) {
      return
    }

    const [hours, minutes] = dueTime.split(':')
    const dueDateWithTime = new Date(dueDate)
    dueDateWithTime.setHours(parseInt(hours), parseInt(minutes))

    setLoading(true)
    try {
      await onCreateAssignment({
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDateWithTime.toISOString(),
        allowLateSubmission,
      })
      
      setTitle("")
      setDescription("")
      setDueDate(undefined)
      setDueTime("23:59")
      setAllowLateSubmission(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
          <DialogDescription>
            Create a new assignment for your students
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Chapter 5 Homework"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Assignment instructions and requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Due Date *</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-32"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="lateSubmission">Allow Late Submissions</Label>
              <p className="text-xs text-muted-foreground">
                Students can submit after the due date
              </p>
            </div>
            <Switch
              id="lateSubmission"
              checked={allowLateSubmission}
              onCheckedChange={setAllowLateSubmission}
            />
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
            <Button 
              type="submit" 
              disabled={loading || !title.trim() || !description.trim() || !dueDate}
            >
              {loading ? "Creating..." : "Create Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
