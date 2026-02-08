"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Edit2, Save, X } from "lucide-react"
import { Class, ClassRole } from "@/types/classes"
import { toast } from "sonner"

interface AboutTabProps {
  classData: Class
  userRole: ClassRole | null
  onUpdate: () => void
}

export function AboutTab({ classData, userRole, onUpdate }: AboutTabProps) {
  const [editing, setEditing] = useState(false)
  const [description, setDescription] = useState(classData.description || "")
  const [syllabus, setSyllabus] = useState(classData.syllabus || "")
  const [allowStudentPosts, setAllowStudentPosts] = useState(classData.allowStudentPosts)
  const [allowComments, setAllowComments] = useState(classData.allowComments)
  const [loading, setLoading] = useState(false)

  const isAdmin = userRole === 'admin'

  const handleSave = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/classes/${classData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim() || null,
          syllabus: syllabus.trim() || null,
          allowStudentPosts,
          allowComments,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update class")
      }

      toast.success("Class updated successfully!")
      setEditing(false)
      onUpdate()
    } catch (error) {
      console.error("Failed to update class:", error)
      toast.error("Failed to update class")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setDescription(classData.description || "")
    setSyllabus(classData.syllabus || "")
    setAllowStudentPosts(classData.allowStudentPosts)
    setAllowComments(classData.allowComments)
    setEditing(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Class Information</CardTitle>
            {isAdmin && !editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            {isAdmin && editing && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            {editing ? (
              <Textarea
                id="description"
                placeholder="Class description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {classData.description || "No description provided"}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="syllabus">Syllabus</Label>
            {editing ? (
              <Textarea
                id="syllabus"
                placeholder="Course syllabus, objectives, grading policy..."
                value={syllabus}
                onChange={(e) => setSyllabus(e.target.value)}
                rows={8}
              />
            ) : (
              <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded-lg">
                {classData.syllabus || "No syllabus provided"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Class Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="studentPosts">Allow Student Posts</Label>
                <p className="text-sm text-muted-foreground">
                  Students can create posts in the class stream
                </p>
              </div>
              <Switch
                id="studentPosts"
                checked={allowStudentPosts}
                onCheckedChange={setAllowStudentPosts}
                disabled={!editing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="comments">Allow Comments</Label>
                <p className="text-sm text-muted-foreground">
                  Members can comment on posts
                </p>
              </div>
              <Switch
                id="comments"
                checked={allowComments}
                onCheckedChange={setAllowComments}
                disabled={!editing}
              />
            </div>

            <div className="pt-4 border-t">
              <div className="space-y-2">
                <Label>Join Code</Label>
                <div className="flex items-center gap-2">
                  <code className="px-4 py-2 bg-muted rounded-md font-mono text-lg font-bold">
                    {classData.joinCode}
                  </code>
                  <p className="text-sm text-muted-foreground">
                    Share this code with students to let them join the class
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="space-y-2">
                <Label>Created By</Label>
                <div className="flex items-center gap-2">
                  <p className="text-sm">
                    {classData.creator?.name || classData.creator?.email || 'Unknown'}
                  </p>
                  <span className="text-sm text-muted-foreground">
                    on {new Date(classData.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
