"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, ListFilter } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Assignment, ClassRole } from "@/types/classes"
import { AssignmentCard } from "@/components/classes/assignment-card"
import { CreateAssignmentModal } from "@/components/classes/create-assignment-modal"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"

interface AssignmentsTabProps {
  classId: string
  userRole: ClassRole | null
}

export function AssignmentsTab({ classId, userRole }: AssignmentsTabProps) {
  const { data: session } = useSession()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [filter, setFilter] = useState<"all" | "todo" | "done" | "late">("all")
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const isTeacherOrAdmin = userRole === 'admin' || userRole === 'teacher'
  const userId = (session?.user as any)?.id

  useEffect(() => {
    loadAssignments()
  }, [classId])

  const loadAssignments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/classes/${classId}/assignments`)
      
      if (!response.ok) {
        throw new Error("Failed to load assignments")
      }

      const data = await response.json()
      setAssignments(data)
    } catch (error) {
      console.error("Failed to load assignments:", error)
      toast.error("Failed to load assignments")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssignment = async (assignmentData: {
    title: string
    description: string
    dueDate: string
    allowLateSubmission: boolean
  }) => {
    try {
      const response = await fetch(`/api/classes/${classId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignmentData),
      })

      if (!response.ok) {
        throw new Error("Failed to create assignment")
      }

      toast.success("Assignment created successfully!")
      setCreateModalOpen(false)
      loadAssignments()
    } catch (error) {
      console.error("Failed to create assignment:", error)
      toast.error("Failed to create assignment")
    }
  }

  const filteredAssignments = assignments.filter((assignment) => {
    if (filter === "all") return true
    
    const hasSubmission = assignment.userSubmission !== undefined
    const isLate = new Date() > new Date(assignment.dueDate)
    
    if (filter === "todo") return !hasSubmission && !isLate
    if (filter === "done") return hasSubmission
    if (filter === "late") return !hasSubmission && isLate
    
    return true
  })

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListFilter className="h-4 w-4 text-muted-foreground" />
          <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="late">Late</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="secondary">{filteredAssignments.length} assignments</Badge>
        </div>

        {isTeacherOrAdmin && (
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        )}
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-card">
          <p className="text-muted-foreground">
            {filter === "all" 
              ? "No assignments yet" 
              : `No ${filter} assignments`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              classId={classId}
              userRole={userRole}
              onUpdate={loadAssignments}
            />
          ))}
        </div>
      )}

      {isTeacherOrAdmin && (
        <CreateAssignmentModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onCreateAssignment={handleCreateAssignment}
        />
      )}
    </div>
  )
}
