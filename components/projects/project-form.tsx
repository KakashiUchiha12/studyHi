"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { ProjectCSVImporter } from "./project-csv-importer"

const CATEGORIES = [
    "Web Development",
    "Mobile Development",
    "Data Science",
    "Machine Learning",
    "Game Development",
    "Design",
    "Other",
]

interface ProjectSection {
    order: number
    title: string
    content: string
    images?: string[]
    videoUrl?: string
    videoType?: string
    websiteUrl?: string
}

interface ProjectFormProps {
    initialData?: {
        id?: string
        title: string
        description: string
        coverImage?: string
        category?: string
        tags?: string[]
        sections?: ProjectSection[]
        isPublished?: boolean
    }
    mode?: "create" | "edit"
}

export function ProjectForm({ initialData, mode = "create" }: ProjectFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const [title, setTitle] = useState(initialData?.title || "")
    const [description, setDescription] = useState(initialData?.description || "")
    const [category, setCategory] = useState(initialData?.category || "")
    const [coverImage, setCoverImage] = useState(initialData?.coverImage || "")
    const [tagInput, setTagInput] = useState("")
    const [tags, setTags] = useState<string[]>(initialData?.tags || [])
    const [sections, setSections] = useState<ProjectSection[]>(
        initialData?.sections || [{ order: 0, title: "", content: "" }]
    )
    const [isPublished, setIsPublished] = useState(initialData?.isPublished || false)

    const addTag = () => {
        if (tagInput.trim() && !tags.includes(tagInput.trim())) {
            setTags([...tags, tagInput.trim()])
            setTagInput("")
        }
    }

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove))
    }

    const addSection = () => {
        setSections([...sections, { order: sections.length, title: "", content: "" }])
    }

    const removeSection = (index: number) => {
        setSections(sections.filter((_, i) => i !== index))
    }

    const updateSection = (index: number, field: keyof ProjectSection, value: string) => {
        const updated = [...sections]
        updated[index] = { ...updated[index], [field]: value }
        setSections(updated)
    }

    const handleSubmit = async (e: React.FormEvent, publish: boolean = false) => {
        e.preventDefault()

        if (!title.trim() || !description.trim()) {
            toast.error("Please fill in title and description")
            return
        }

        setLoading(true)

        try {
            const url = mode === "edit" ? `/api/projects/${initialData?.id}` : "/api/projects"
            const method = mode === "edit" ? "PUT" : "POST"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    description,
                    coverImage: coverImage || undefined,
                    category: category || undefined,
                    tags,
                    sections: sections.filter((s) => s.title && s.content),
                    isPublished: publish,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "Failed to save project")
            }

            const project = await response.json()
            toast.success(publish ? "Project published!" : "Project saved as draft")
            router.push(`/projects/${project.id}`)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    const handleCSVImport = (data: {
        title: string
        description: string
        coverImage?: string
        category?: string
        tags?: string[]
        sections: Array<{
            order: number
            title: string
            content: string
            images?: string[]
            videoUrl?: string
        }>
    }) => {
        setTitle(data.title)
        setDescription(data.description)
        setCoverImage(data.coverImage || "")
        setCategory(data.category || "")
        setTags(data.tags || [])
        setSections(data.sections)
        toast.success("Project data imported! You can now edit and publish.")
    }

    return (
        <form className="space-y-8 max-w-4xl mx-auto">
            {mode === "create" && (
                <ProjectCSVImporter onImport={handleCSVImport} />
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Project Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter project title"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your project"
                            rows={4}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="coverImage">Cover Image</Label>
                        <div className="space-y-4">
                            {coverImage && (
                                <div className="relative aspect-video w-full max-w-md rounded-lg overflow-hidden border">
                                    <img
                                        src={coverImage}
                                        alt="Cover preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                        onClick={() => setCoverImage("")}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            <Input
                                id="coverImage"
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                        setLoading(true)
                                        try {
                                            const formData = new FormData()
                                            formData.append("file", file)
                                            formData.append("subfolder", "projects")

                                            const response = await fetch("/api/upload", {
                                                method: "POST",
                                                body: formData,
                                            })

                                            if (!response.ok) throw new Error("Upload failed")

                                            const data = await response.json()
                                            setCoverImage(data.url)
                                            toast.success("Image uploaded successfully")
                                        } catch (error) {
                                            toast.error("Failed to upload image")
                                        } finally {
                                            setLoading(false)
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex gap-2">
                            <Input
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                                placeholder="Add a tag"
                            />
                            <Button type="button" onClick={addTag} variant="outline">
                                Add
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="gap-1">
                                    {tag}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => removeTag(tag)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Project Sections</CardTitle>
                        <Button type="button" onClick={addSection} variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Section
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {sections.map((section, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Section {index + 1}</Label>
                                {sections.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeSection(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Section Title</Label>
                                <Input
                                    value={section.title}
                                    onChange={(e) => updateSection(index, "title", e.target.value)}
                                    placeholder="Enter section title"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Content</Label>
                                <Textarea
                                    value={section.content}
                                    onChange={(e) => updateSection(index, "content", e.target.value)}
                                    placeholder="Write your content here..."
                                    rows={6}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Video URL (optional)</Label>
                                <Input
                                    value={section.videoUrl || ""}
                                    onChange={(e) => updateSection(index, "videoUrl", e.target.value)}
                                    placeholder="https://youtube.com/watch?v=..."
                                    type="url"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Embed Website URL (optional)</Label>
                                <Input
                                    value={(section as any).websiteUrl || ""}
                                    onChange={(e) => {
                                        const updated = [...sections]
                                        updated[index] = { ...updated[index], websiteUrl: e.target.value } as any
                                        setSections(updated)
                                    }}
                                    placeholder="https://example.com"
                                    type="url"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Embed a live website in this section
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Section Images (optional)</Label>
                                <div className="space-y-4">
                                    {section.images && section.images.length > 0 && (
                                        <div className="grid grid-cols-2 gap-4">
                                            {section.images.map((img, imgIdx) => (
                                                <div key={imgIdx} className="relative aspect-video rounded-lg overflow-hidden border">
                                                    <img
                                                        src={img}
                                                        alt={`Section ${index + 1} - Image ${imgIdx + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        className="absolute top-2 right-2"
                                                        onClick={() => {
                                                            const updated = [...sections]
                                                            updated[index].images = section.images?.filter((_, i) => i !== imgIdx)
                                                            setSections(updated)
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={async (e) => {
                                            const files = Array.from(e.target.files || [])
                                            if (files.length === 0) return

                                            setLoading(true)
                                            try {
                                                const uploadedUrls: string[] = []

                                                for (const file of files) {
                                                    const formData = new FormData()
                                                    formData.append("file", file)
                                                    formData.append("subfolder", "projects/sections")

                                                    const response = await fetch("/api/upload", {
                                                        method: "POST",
                                                        body: formData,
                                                    })

                                                    if (!response.ok) throw new Error("Upload failed")

                                                    const data = await response.json()
                                                    uploadedUrls.push(data.url)
                                                }

                                                const updated = [...sections]
                                                updated[index].images = [...(section.images || []), ...uploadedUrls]
                                                setSections(updated)
                                                toast.success(`${files.length} image(s) uploaded successfully`)

                                                // Reset file input
                                                e.target.value = ""
                                            } catch (error) {
                                                toast.error("Failed to upload images")
                                            } finally {
                                                setLoading(false)
                                            }
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Upload up to 3 images per section
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="flex gap-4 justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => handleSubmit(e, false)}
                    disabled={loading}
                >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save as Draft
                </Button>
                <Button
                    type="button"
                    onClick={(e) => handleSubmit(e, true)}
                    disabled={loading}
                >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {mode === "edit" ? "Update & Publish" : "Publish Project"}
                </Button>
            </div>
        </form >
    )
}
