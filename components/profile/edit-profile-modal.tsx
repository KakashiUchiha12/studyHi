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

interface ProfileData {
    fullName: string
    university?: string
    program?: string
    currentYear?: string
    gpa?: string
    bio?: string
    profilePicture?: string
}

interface EditProfileModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (data: ProfileData) => Promise<void>
    initialData: ProfileData
}

export function EditProfileModal({ isOpen, onClose, onSave, initialData }: EditProfileModalProps) {
    const [formData, setFormData] = useState<ProfileData>(initialData)
    const [isSaving, setIsSaving] = useState(false)

    // Update form data when initialData changes
    useEffect(() => {
        setFormData(initialData)
    }, [initialData])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        try {
            await onSave(formData)
            onClose()
        } catch (error) {
            console.error("Failed to save profile:", error)
        } finally {
            setIsSaving(false)
        }
    }

    const handleChange = (field: keyof ProfileData, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Make changes to your public profile here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) => handleChange("fullName", e.target.value)}
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gpa">GPA (Optional)</Label>
                            <Input
                                id="gpa"
                                value={formData.gpa || ""}
                                onChange={(e) => handleChange("gpa", e.target.value)}
                                placeholder="3.8"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="university">University</Label>
                        <Input
                            id="university"
                            value={formData.university || ""}
                            onChange={(e) => handleChange("university", e.target.value)}
                            placeholder="University of Technology"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="program">Program / Major</Label>
                            <Input
                                id="program"
                                value={formData.program || ""}
                                onChange={(e) => handleChange("program", e.target.value)}
                                placeholder="Computer Science"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="year">Current Year</Label>
                            <Select
                                value={formData.currentYear || ""}
                                onValueChange={(value) => handleChange("currentYear", value)}
                            >
                                <SelectTrigger id="year">
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Freshman">Freshman</SelectItem>
                                    <SelectItem value="Sophomore">Sophomore</SelectItem>
                                    <SelectItem value="Junior">Junior</SelectItem>
                                    <SelectItem value="Senior">Senior</SelectItem>
                                    <SelectItem value="Graduate">Graduate</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                            id="bio"
                            value={formData.bio || ""}
                            onChange={(e) => handleChange("bio", e.target.value)}
                            placeholder="Tell us a bit about yourself..."
                            className="resize-none"
                            rows={4}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
