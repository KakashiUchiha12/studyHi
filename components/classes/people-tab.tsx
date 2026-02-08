"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ClassMember, ClassRole } from "@/types/classes"
import { MemberCard } from "@/components/classes/member-card"
import { PendingRequests } from "@/components/classes/pending-requests"
import { Skeleton } from "@/components/ui/skeleton"

interface PeopleTabProps {
  classId: string
  userRole: ClassRole | null
  onUpdate: () => void
}

export function PeopleTab({ classId, userRole, onUpdate }: PeopleTabProps) {
  const [members, setMembers] = useState<ClassMember[]>([])
  const [loading, setLoading] = useState(true)

  const isAdmin = userRole === 'admin'

  useEffect(() => {
    loadMembers()
  }, [classId])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/classes/${classId}/members`)
      
      if (!response.ok) {
        throw new Error("Failed to load members")
      }

      const data = await response.json()
      setMembers(data)
    } catch (error) {
      console.error("Failed to load members:", error)
      toast.error("Failed to load members")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) {
      return
    }

    try {
      const response = await fetch(`/api/classes/${classId}/members/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to remove member")
      }

      toast.success("Member removed successfully!")
      loadMembers()
      onUpdate()
    } catch (error: any) {
      console.error("Failed to remove member:", error)
      toast.error(error.message || "Failed to remove member")
    }
  }

  const handleChangeRole = async (userId: string, newRole: ClassRole) => {
    try {
      const response = await fetch(`/api/classes/${classId}/members/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to change role")
      }

      toast.success("Role updated successfully!")
      loadMembers()
      onUpdate()
    } catch (error: any) {
      console.error("Failed to change role:", error)
      toast.error(error.message || "Failed to change role")
    }
  }

  const admins = members.filter(m => m.role === 'admin')
  const teachers = members.filter(m => m.role === 'teacher')
  const students = members.filter(m => m.role === 'student')

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {isAdmin && (
        <PendingRequests classId={classId} onUpdate={() => { loadMembers(); onUpdate(); }} />
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            Admins
            <Badge variant="secondary">{admins.length}</Badge>
          </h3>
          <div className="space-y-2">
            {admins.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isAdmin={isAdmin}
                onRemove={handleRemoveMember}
                onChangeRole={handleChangeRole}
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            Teachers
            <Badge variant="secondary">{teachers.length}</Badge>
          </h3>
          <div className="space-y-2">
            {teachers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teachers yet</p>
            ) : (
              teachers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  isAdmin={isAdmin}
                  onRemove={handleRemoveMember}
                  onChangeRole={handleChangeRole}
                />
              ))
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            Students
            <Badge variant="secondary">{students.length}</Badge>
          </h3>
          <div className="space-y-2">
            {students.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isAdmin={isAdmin}
                onRemove={handleRemoveMember}
                onChangeRole={handleChangeRole}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
