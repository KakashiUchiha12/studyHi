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
  Users
} from "lucide-react"
import { Assignment, ClassRole } from "@/types/classes"
import { SubmitAssignmentModal } from "@/components/classes/submit-assignment-modal"
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
  
  const userId = (session?.user as any)?.id
  const isTeacherOrAdmin = userRole === 'admin' || userRole === 'teacher'
  const isStudent = userRole === 'student'
  
  const dueDate = new Date(assignment.dueDate)
  const now = new Date()
  const isOverdue = now > dueDate && !assignment.userSubmission
  const isSubmitted = !!assignment.userSubmission
  const isLate = assignment.userSubmission?.isLate || false
  const isGraded = assignment.userSubmission?.grade !== null && assignment.userSubmission?.grade !== undefined

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this assignment? All submissions will be deleted.")) {
      return
    }

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
              {isTeacherOrAdmin && (
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {assignment._count?.submissions || 0} submissions
                </div>
              )}
            </div>
          </div>

          {isTeacherOrAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm whitespace-pre-wrap">{assignment.description}</p>

        {assignment.attachments && assignment.attachments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Attachments:</p>
            {assignment.attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-primary hover:underline"
              >
                <FileText className="h-4 w-4 inline mr-1" />
                Attachment {index + 1}
              </a>
            ))}
          </div>
        )}

        {assignment.userSubmission?.feedback && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Feedback:</p>
            <p className="text-sm">{assignment.userSubmission.feedback}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          {isStudent && !isSubmitted && (!isOverdue || assignment.allowLateSubmission) && (
            <Button onClick={() => setSubmitModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Submit Assignment
            </Button>
          )}
          {isTeacherOrAdmin && (
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
    </Card>
  )
}
