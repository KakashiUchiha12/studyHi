"use client"

import { useState, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Loader2, Globe, Lock, Trash2, AlertCircle, Upload, Image as ImageIcon } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ImageCropper } from "@/components/ui/image-cropper"

export default function EditCoursePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const courseId = params.id
  const navigationRouter = useRouter()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formInputs, setFormInputs] = useState({
    title: "",
    shortDescription: "",
    description: "",
    category: "",
    difficulty: "beginner",
    language: "en",
    isPaid: false,
    price: 0,
    currency: "USD",
    status: "draft",
    isDraft: true,
    courseImage: ""
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [isCropperOpen, setIsCropperOpen] = useState(false)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.addEventListener("load", () => {
      setCropImageSrc(reader.result as string)
      setIsCropperOpen(true)
    })
    reader.readAsDataURL(file)
    // Clear input value so same file can be selected again if needed
    e.target.value = ''
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!croppedBlob) return

    setIsUploading(true)
    const formData = new FormData()

    // Create a file from the blob
    const file = new File([croppedBlob], "course-cover.jpg", { type: "image/jpeg" })
    formData.append('file', file)
    formData.append('subfolder', 'courses/covers')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setFormInputs(prev => ({ ...prev, courseImage: data.url }))
        toast.success("Image uploaded successfully")
      } else {
        toast.error("Upload failed")
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error("Error uploading image")
    } finally {
      setIsUploading(false)
      setIsCropperOpen(false)
    }
  }

  const triggerUpload = () => {
    fileInputRef.current?.click()
  }

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}`)
        if (!response.ok) throw new Error("Failed to load course details")

        const data = await response.json()
        setFormInputs({
          title: data.title || "",
          shortDescription: data.shortDescription || "",
          description: data.description || "",
          category: data.category || "",
          difficulty: data.difficulty || "beginner",
          language: data.language || "en",
          isPaid: data.isPaid || false,
          price: data.price || 0,
          currency: data.currency || "USD",
          status: data.status || "draft",
          isDraft: data.isDraft ?? true,
          courseImage: data.courseImage || ""
        })
      } catch (err: any) {
        setError(err.message)
        toast.error("Error loading course")
      } finally {
        setLoading(false)
      }
    }

    fetchCourseData()
  }, [courseId])

  const handleInputChange = (field: string, value: any) => {
    setFormInputs(prev => ({ ...prev, [field]: value }))
  }

  const handleToggleStatus = (checked: boolean) => {
    const newStatus = checked ? "published" : "draft"
    setFormInputs(prev => ({
      ...prev,
      status: newStatus,
      isDraft: !checked
    }))
  }

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formInputs)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update course")
      }

      toast.success("Course updated successfully")
      navigationRouter.refresh()
    } catch (err: any) {
      console.error("Update error:", err)
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Retrieving course data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="mt-6 text-center">
          <Link href="/courses/instructor">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      <div className="border-b bg-card sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-4">
              <Link href="/courses/instructor">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold line-clamp-1">{formInputs.title}</h1>
              <Badge variant={formInputs.status === 'published' ? 'default' : 'secondary'}>
                {formInputs.status.charAt(0).toUpperCase() + formInputs.status.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleUpdateCourse} disabled={submitting} className="gap-2">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Details
              </Button>
            </div>
          </div>
          <div className="flex gap-8">
            <Link
              href={`/courses/instructor/${courseId}/edit`}
              className="px-4 py-3 border-b-2 border-primary text-primary font-medium"
            >
              Basic Details
            </Link>
            <Link
              href={`/courses/instructor/${courseId}/content`}
              className="px-4 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors"
            >
              Curriculum
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <form onSubmit={handleUpdateCourse} className="space-y-8">
          {/* Status & Visibility Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {formInputs.status === "published" ? <Globe className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-muted-foreground" />}
                Course Visibility
              </CardTitle>
              <CardDescription>
                Control whether your course is visible to the public.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-background rounded-lg border shadow-sm">
                <div className="space-y-0.5">
                  <Label className="text-base">Published Status</Label>
                  <p className="text-sm text-muted-foreground">
                    {formInputs.status === "published"
                      ? "Your course is live in the catalog."
                      : "Your course is private and only visible to you."}
                  </p>
                </div>
                <Switch
                  checked={formInputs.status === "published"}
                  onCheckedChange={handleToggleStatus}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Course Media
              </CardTitle>
              <CardDescription>
                Upload a cover image for your course. This will be displayed in the course catalog.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-4">
                  <div className="relative aspect-video w-full max-w-md bg-muted rounded-lg overflow-hidden border border-border flex items-center justify-center">
                    {formInputs.courseImage ? (
                      <div className="relative w-full h-full group">
                        <img
                          src={formInputs.courseImage}
                          alt="Course Cover"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => setFormInputs(prev => ({ ...prev, courseImage: "" }))}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remove Image
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground p-6 text-center">
                        <ImageIcon className="h-10 w-10 opacity-20" />
                        <p className="text-sm">No cover image uploaded</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={triggerUpload}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          {formInputs.courseImage ? "Change Cover Image" : "Upload Cover Image"}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Recommended size: 1280x720 (16:9 aspect ratio)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Complete Web Development Bootcamp"
                  value={formInputs.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDesc">Short Description *</Label>
                <Input
                  id="shortDesc"
                  placeholder="A brief one-liner about your course"
                  value={formInputs.shortDescription}
                  onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullDesc">Full Description *</Label>
                <Textarea
                  id="fullDesc"
                  placeholder="Detailed description of what students will learn"
                  value={formInputs.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formInputs.category}
                    onValueChange={(val) => handleInputChange("category", val)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Programming">Programming</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Data Science">Data Science</SelectItem>
                      <SelectItem value="Personal Development">Personal Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level *</Label>
                  <Select
                    value={formInputs.difficulty}
                    onValueChange={(val) => handleInputChange("difficulty", val)}
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formInputs.language}
                  onValueChange={(val) => handleInputChange("language", val)}
                >
                  <SelectTrigger id="language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center py-4">
            <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10 gap-2">
              {/* Future: Add delete course functionality */}
            </Button>
            <div className="flex gap-3">
              <Link href="/courses/instructor">
                <Button type="button" variant="outline">Discard Changes</Button>
              </Link>
              <Button type="submit" disabled={submitting} className="gap-2 min-w-[140px]">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      <ImageCropper
        open={isCropperOpen}
        onOpenChange={setIsCropperOpen}
        imageSrc={cropImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={16 / 9}
      />
    </div>
  )
}

function Badge({ children, variant = "default" }: { children: React.ReactNode, variant?: "default" | "secondary" }) {
  const styles = variant === "default"
    ? "bg-primary/10 text-primary border-primary/20"
    : "bg-muted text-muted-foreground border-border"

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}>
      {children}
    </span>
  )
}
