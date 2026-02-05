"use client"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface GoalTask {
    id?: string
    title: string
    priority: string
    dueDate?: Date
    completed: boolean
}

interface GoalTaskModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (task: Partial<GoalTask>) => Promise<void>
    initialData?: Partial<GoalTask> | null
    mode: "create" | "edit"
}

export function GoalTaskModal({ isOpen, onClose, onSave, initialData, mode }: GoalTaskModalProps) {
    const [formData, setFormData] = useState<Partial<GoalTask>>({
        title: "",
        priority: "Medium",
        completed: false,
        dueDate: undefined
    })
    const [isSaving, setIsSaving] = useState(false)
    const [dateString, setDateString] = useState("")

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || "",
                priority: initialData.priority || "Medium",
                completed: initialData.completed || false,
                dueDate: initialData.dueDate,
                id: initialData.id
            })

            if (initialData.dueDate) {
                const date = new Date(initialData.dueDate)
                if (!isNaN(date.getTime())) {
                    setDateString(date.toISOString().split('T')[0])
                }
            } else {
                setDateString("")
            }
        } else {
            setFormData({
                title: "",
                priority: "Medium",
                completed: false,
                dueDate: undefined
            })
            setDateString("")
        }
    }, [initialData, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            const submissionData = {
                ...formData,
                dueDate: dateString ? new Date(dateString) : undefined
            }
            await onSave(submissionData)
            onClose()
        } catch (error) {
            console.error("Failed to save task:", error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleChange = (field: keyof GoalTask, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Add New Task" : "Edit Task"}</DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Break down your goal into manageable steps."
                            : "Update task details."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Task Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            placeholder="e.g., Read chapter 1"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select
                            value={formData.priority}
                            onValueChange={(value) => handleChange("priority", value)}
                        >
                            <SelectTrigger id="priority">
                                <SelectValue placeholder="Select Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="High">High</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dueDate">Due Date (Optional)</Label>
                        <Input
                            id="dueDate"
                            type="date"
                            value={dateString}
                            onChange={(e) => setDateString(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? "Saving..." : mode === "create" ? "Add Task" : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
