"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"

export default function CourseCreationForm() {
  const navigationRouter = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [formInputs, setFormInputs] = useState({
    title: "",
    shortDescription: "",
    description: "",
    category: "",
    difficulty: "beginner",
    language: "en",
    isPaid: false,
    price: 0,
    currency: "USD"
  })

  const handleInputChange = (field: string, value: any) => {
    setFormInputs(prev => ({ ...prev, [field]: value }))
  }

  const submitNewCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formInputs)
      })

      const result = await response.json()

      if (response.ok) {
        navigationRouter.push(`/courses/instructor/${result.id}/content`)
      } else {
        console.error("Failed to create course:", result)
        alert(`Failed to create course: ${response.status} ${result.error || result.details || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error("Submission error:", error)
      alert(`An error occurred: ${error.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <Link href="/courses/instructor">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Create New Course</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <form onSubmit={submitNewCourse} className="space-y-8">
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

          <div className="flex justify-end gap-3 text-muted-foreground italic text-sm py-4">
            * All courses are free by default
          </div>

          <div className="flex justify-end gap-3">
            <Link href="/courses/instructor">
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Create Course
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
