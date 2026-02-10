"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { ImageCropper } from "@/components/ui/image-cropper"
import { Trash2, Save } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Class } from "@/types/classes"

interface SettingsTabProps {
    classData: Class
    onUpdate: () => void
}

export function SettingsTab({ classData, onUpdate }: SettingsTabProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isUploadingCover, setIsUploadingCover] = useState(false)
    const [isUploadingIcon, setIsUploadingIcon] = useState(false)
    const [cropperOpen, setCropperOpen] = useState(false)
    const [cropperImage, setCropperImage] = useState<string | null>(null)
    const [cropperType, setCropperType] = useState<'cover' | 'icon'>('cover')

    const [formData, setFormData] = useState({
        name: classData.name || "",
        description: classData.description || "",
        subject: classData.subject || "",
        room: classData.room || "",
        syllabus: classData.syllabus || "",
        coverImage: classData.coverImage || "",
        icon: classData.icon || "",
        bannerImage: classData.bannerImage || "",
        allowStudentPosts: classData.allowStudentPosts ?? true,
        allowComments: classData.allowComments ?? true
    })

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleFileUpload = async (blob: Blob, type: 'cover' | 'icon') => {
        const setUploading = type === 'cover' ? setIsUploadingCover : setIsUploadingIcon
        setUploading(true)

        try {
            const formData = new FormData()
            formData.append('file', blob, 'image.jpg')

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                throw new Error('Failed to upload file')
            }

            const data = await response.json()
            const fieldName = type === 'cover' ? 'bannerImage' : 'icon'
            handleChange(fieldName, data.url)
            toast.success(`${type === 'cover' ? 'Cover image' : 'Icon'} uploaded successfully!`)
        } catch (error) {
            console.error('Failed to upload file:', error)
            toast.error('Failed to upload file')
        } finally {
            setUploading(false)
        }
    }

    const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = () => {
                setCropperImage(reader.result as string)
                setCropperType('cover')
                setCropperOpen(true)
            }
            reader.readAsDataURL(file)
            // Reset input
            e.target.value = ''
        }
    }

    const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = () => {
                setCropperImage(reader.result as string)
                setCropperType('icon')
                setCropperOpen(true)
            }
            reader.readAsDataURL(file)
            // Reset input
            e.target.value = ''
        }
    }

    const handleCropComplete = async (croppedBlob: Blob) => {
        await handleFileUpload(croppedBlob, cropperType)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch(`/api/classes/${classData.id}/settings`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                throw new Error("Failed to update settings")
            }

            toast.success("Settings updated successfully!")
            onUpdate()
        } catch (error) {
            console.error("Failed to update settings:", error)
            toast.error("Failed to update settings")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true)

        try {
            const response = await fetch(`/api/classes/${classData.id}`, {
                method: "DELETE"
            })

            if (!response.ok) {
                throw new Error("Failed to delete class")
            }

            toast.success("Class deleted successfully!")
            router.push("/classes")
        } catch (error) {
            console.error("Failed to delete class:", error)
            toast.error("Failed to delete class")
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* General Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>General Settings</CardTitle>
                        <CardDescription>Basic information about your class</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Class Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                placeholder="e.g., Mathematics 101"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                value={formData.subject}
                                onChange={(e) => handleChange("subject", e.target.value)}
                                placeholder="e.g., Mathematics"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="room">Room</Label>
                            <Input
                                id="room"
                                value={formData.room}
                                onChange={(e) => handleChange("room", e.target.value)}
                                placeholder="e.g., Room 210"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => handleChange("description", e.target.value)}
                                placeholder="Brief description of the class"
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="syllabus">Syllabus</Label>
                            <Textarea
                                id="syllabus"
                                value={formData.syllabus}
                                onChange={(e) => handleChange("syllabus", e.target.value)}
                                placeholder="Course syllabus and learning objectives"
                                rows={5}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Image Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Images</CardTitle>
                        <CardDescription>Customize your class appearance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="bannerImage">Banner Image</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="bannerImage"
                                    value={formData.bannerImage}
                                    onChange={(e) => handleChange("bannerImage", e.target.value)}
                                    placeholder="https://example.com/banner.jpg or upload"
                                />
                                <input
                                    type="file"
                                    id="coverImageFile"
                                    accept="image/*"
                                    onChange={handleCoverImageChange}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('coverImageFile')?.click()}
                                    disabled={isUploadingCover}
                                >
                                    {isUploadingCover ? "Uploading..." : "Upload"}
                                </Button>
                            </div>
                            {formData.bannerImage && (
                                <div className="mt-2 rounded-lg border overflow-hidden">
                                    <img
                                        src={formData.bannerImage}
                                        alt="Banner preview"
                                        className="w-full h-48 object-cover"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="icon">Icon</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="icon"
                                    value={formData.icon}
                                    onChange={(e) => handleChange("icon", e.target.value)}
                                    placeholder="https://example.com/icon.png or upload"
                                />
                                <input
                                    type="file"
                                    id="iconFile"
                                    accept="image/*"
                                    onChange={handleIconChange}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById('iconFile')?.click()}
                                    disabled={isUploadingIcon}
                                >
                                    {isUploadingIcon ? "Uploading..." : "Upload"}
                                </Button>
                            </div>
                            {formData.icon && (
                                <div className="mt-2">
                                    <img
                                        src={formData.icon}
                                        alt="Icon preview"
                                        className="w-16 h-16 rounded-lg object-cover border"
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Privacy & Permissions</CardTitle>
                        <CardDescription>Control what class members can do</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="allowStudentPosts">Allow Student Posts</Label>
                                <div className="text-sm text-muted-foreground">
                                    Let students create posts in the class stream
                                </div>
                            </div>
                            <Switch
                                id="allowStudentPosts"
                                checked={formData.allowStudentPosts}
                                onCheckedChange={(checked) => handleChange("allowStudentPosts", checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="allowComments">Allow Comments</Label>
                                <div className="text-sm text-muted-foreground">
                                    Let members comment on posts
                                </div>
                            </div>
                            <Switch
                                id="allowComments"
                                checked={formData.allowComments}
                                onCheckedChange={(checked) => handleChange("allowComments", checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit" disabled={isLoading}>
                        <Save className="h-4 w-4 mr-2" />
                        {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>

            {/* Danger Zone */}
            <Card className="border-destructive">
                <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isDeleting}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Class
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the class
                                    and all associated data including posts, assignments, and submissions.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Delete Permanently
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardContent>
            </Card>

            {/* Image Cropper Modal */}
            <ImageCropper
                imageSrc={cropperImage}
                open={cropperOpen}
                onOpenChange={setCropperOpen}
                onCropComplete={handleCropComplete}
                aspectRatio={cropperType === 'cover' ? 16 / 9 : 1}
            />
        </div>
    )
}
