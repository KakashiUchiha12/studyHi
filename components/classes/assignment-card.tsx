"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Clock,
  FileText,
  CheckCircle2,
  XCircle,
  Upload,
  Trash2,
  Users,
  Pencil
} from "lucide-react"
import { Assignment, ClassRole } from "@/types/classes"
import { SubmitAssignmentModal } from "@/components/classes/submit-assignment-modal"
import { CreateAssignmentModal } from "@/components/classes/create-assignment-modal"
import { FilePreview } from "@/components/file-preview"
import { DeleteAssignmentDialog } from "@/components/classes/confirmation-dialogs"
import { toast } from "sonner"
import { useSession } from "next-auth/react"

interface AssignmentCardProps {
  assignment: Assignment
  classId: string
  userRole: ClassRole | null
  onUpdate: () => void
}

export function AssignmentCard({
  assignment,
  classId,
  userRole,
  onUpdate,
}: AssignmentCardProps) {
  const { data: session } = useSession()
  const [submitModalOpen, setSubmitModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)

  const userId = (session?.user as any)?.id
  const isTeacherOrAdmin = userRole === 'admin' || userRole === 'teacher'
  const isTeacher = userRole === 'teacher'
  const isStudent = userRole === 'student'

  const dueDate = new Date(assignment.dueDate)
  const now = new Date()
  const isOverdue = now > dueDate && !assignment.userSubmission
  const isSubmitted = !!assignment.userSubmission
  const isLate = assignment.userSubmission?.isLate || false
  const isGraded = assignment.userSubmission?.grade !== null && assignment.userSubmission?.grade !== undefined

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}/assignments/${assignment.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete assignment")
      }

      toast.success("Assignment deleted successfully!")
      onUpdate()
    } catch (error) {
      console.error("Failed to delete assignment:", error)
      toast.error("Failed to delete assignment")
    }
  }

  const handleEdit = async (assignmentData: any) => {
    try {
      const response = await fetch(`/api/classes/${classId}/assignments/${assignment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignmentData),
      })

      if (!response.ok) {
        throw new Error("Failed to update assignment")
      }

      toast.success("Assignment updated successfully!")
      setEditModalOpen(false)
      onUpdate()
    } catch (error: any) {
      console.error("Failed to update assignment:", error)
      toast.error(error.message || "Failed to update assignment")
    }
  }

  const handleSubmit = async (files: { url: string; name: string; size: number }[]) => {
    try {
      const response = await fetch(`/api/classes/${classId}/assignments/${assignment.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit assignment")
      }

      toast.success("Assignment submitted successfully!")
      setSubmitModalOpen(false)
      onUpdate()
    } catch (error: any) {
      console.error("Failed to submit assignment:", error)
      toast.error(error.message || "Failed to submit assignment")
    }
  }

  const handlePreview = (attachment: any) => {
    const url = typeof attachment === 'string' ? attachment : attachment.url
    const name = typeof attachment === 'string' ? "Attachment" : attachment.name
    const size = typeof attachment === 'string' ? 0 : attachment.size
    const type = typeof attachment === 'string'
      ? (url.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream')
      : (attachment.type === 'pdf' ? 'application/pdf' : (attachment.type === 'image' ? 'image/jpeg' : 'application/octet-stream'))

    setSelectedFile({
      id: url,
      name: name,
      url: url,
      size: size,
      type: type
    })
    setIsPreviewOpen(true)
  }

  return (
    <Card className={isOverdue ? "border-destructive" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-xl">{assignment.title}</CardTitle>
              {isSubmitted && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Submitted
                </Badge>
              )}
              {isLate && (
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                  Late
                </Badge>
              )}
              {isOverdue && (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Overdue
                </Badge>
              )}
              {isGraded && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                  Graded: {assignment.userSubmission?.grade}/100
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Due: {dueDate.toLocaleDateString()}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {isTeacher && (
                <div className="flex items-center text-primary font-medium">
                  <Users className="h-4 w-4 mr-1" />
                  {assignment._count?.submissions || 0} submissions
                </div>
              )}
            </div>
          </div>

          {isTeacher && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="text-muted-foreground hover:text-primary"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm whitespace-pre-wrap">{assignment.description}</p>

        {assignment.attachments && assignment.attachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Attachments:</p>
            {assignment.attachments.map((attachment: any, index: number) => {
              const name = typeof attachment === 'string' ? `Attachment ${index + 1}` : (attachment.name || `Attachment ${index + 1}`)

              return (
                <button
                  key={index}
                  onClick={() => handlePreview(attachment)}
                  className="w-full flex items-center gap-2 p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors text-sm text-primary group text-left"
                >
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate flex-1">{name}</span>
                </button>
              )
            })}
          </div>
        )}

        {assignment.userSubmission?.feedback && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Feedback:</p>
            <p className="text-sm">{assignment.userSubmission.feedback}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          {!isSubmitted && (!isOverdue || assignment.allowLateSubmission) && (
            <Button onClick={() => setSubmitModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Submit Assignment
            </Button>
          )}
          {isTeacher && (
            <Button variant="outline" onClick={() => window.location.href = `/classes/${classId}/assignments/${assignment.id}`}>
              View Submissions
            </Button>
          )}
        </div>
      </CardContent>

      {isStudent && (
        <SubmitAssignmentModal
          open={submitModalOpen}
          onOpenChange={setSubmitModalOpen}
          onSubmit={handleSubmit}
          assignmentTitle={assignment.title}
          maxFileSize={Number(assignment.maxFileSize)}
        />
      )}
      {isTeacherOrAdmin && (
        <CreateAssignmentModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          onSave={handleEdit}
          mode="edit"
          initialData={assignment}
        />
      )}
      {selectedFile && (
        <FilePreview
          file={selectedFile}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </Card>
  )
}
