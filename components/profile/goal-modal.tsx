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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

interface Goal {
    id: string
    title: string
    description: string
    category: string
    status: string
    targetDate?: Date
}

interface GoalModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (goal: Partial<Goal>) => Promise<void>
    initialData?: Partial<Goal> | null
    mode: "create" | "edit"
}

export function GoalModal({ isOpen, onClose, onSave, initialData, mode }: GoalModalProps) {
    const [formData, setFormData] = useState<Partial<Goal>>({
        title: "",
        description: "",
        category: "Academic",
        status: "In Progress",
        targetDate: undefined
    })
    const [isSaving, setIsSaving] = useState(false)
    const [dateString, setDateString] = useState("")

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title || "",
                description: initialData.description || "",
                category: initialData.category || "Academic",
                status: initialData.status || "In Progress",
                targetDate: initialData.targetDate,
                id: initialData.id
            })

            if (initialData.targetDate) {
                // Handle both Date objects and string dates if they come from JSON
                const date = new Date(initialData.targetDate)
                if (!isNaN(date.getTime())) {
                    setDateString(date.toISOString().split('T')[0])
                }
            } else {
                setDateString("")
            }
        } else {
            // Reset form for create mode
            setFormData({
                title: "",
                description: "",
                category: "Academic",
                status: "In Progress",
                targetDate: undefined
            })
            setDateString("")
        }
    }, [initialData, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            // Ensure targetDate is correctly set from dateString
            const submissionData = {
                ...formData,
                targetDate: dateString ? new Date(dateString) : undefined
            }
            await onSave(submissionData)
            onClose()
        } catch (error) {
            console.error("Failed to save goal:", error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleChange = (field: keyof Goal, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Add New Goal" : "Edit Goal"}</DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Set a new target for your academic journey."
                            : "Update your goal details."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Goal Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => handleChange("title", e.target.value)}
                            placeholder="e.g., Master Calculus"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description || ""}
                            onChange={(e) => handleChange("description", e.target.value)}
                            placeholder="Describe what you want to achieve..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(value) => handleChange("category", value)}
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Academic">Academic</SelectItem>
                                    <SelectItem value="Personal">Personal</SelectItem>
                                    <SelectItem value="Career">Career</SelectItem>
                                    <SelectItem value="Skill">Skill</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => handleChange("status", value)}
                            >
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Select Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Not Started">Not Started</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="On Hold">On Hold</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="targetDate">Target Date (Deadline)</Label>
                        <Input
                            id="targetDate"
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
                            {isSaving ? "Saving..." : mode === "create" ? "Create Goal" : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
