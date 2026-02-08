"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Clock } from "lucide-react"
import { ClassMember } from "@/types/classes"
import { toast } from "sonner"

interface PendingRequestsProps {
  classId: string
  onUpdate: () => void
}

export function PendingRequests({ classId, onUpdate }: PendingRequestsProps) {
  const [pendingMembers, setPendingMembers] = useState<ClassMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPendingRequests()
  }, [classId])

  const loadPendingRequests = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/classes/${classId}/members/pending`)
      
      if (!response.ok) {
        throw new Error("Failed to load pending requests")
      }

      const data = await response.json()
      setPendingMembers(data)
    } catch (error) {
      console.error("Failed to load pending requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch(`/api/classes/${classId}/members/${userId}/approve`, {
        method: "PUT",
      })

      if (!response.ok) {
        throw new Error("Failed to approve request")
      }

      toast.success("Request approved!")
      loadPendingRequests()
      onUpdate()
    } catch (error) {
      console.error("Failed to approve request:", error)
      toast.error("Failed to approve request")
    }
  }

  const handleReject = async (userId: string) => {
    try {
      const response = await fetch(`/api/classes/${classId}/members/${userId}/reject`, {
        method: "PUT",
      })

      if (!response.ok) {
        throw new Error("Failed to reject request")
      }

      toast.success("Request rejected")
      loadPendingRequests()
      onUpdate()
    } catch (error) {
      console.error("Failed to reject request:", error)
      toast.error("Failed to reject request")
    }
  }

  if (loading || pendingMembers.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Join Requests
          <Badge variant="secondary">{pendingMembers.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 bg-muted rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={member.user?.image || undefined} />
                <AvatarFallback>
                  {member.user?.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{member.user?.name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                <p className="text-xs text-muted-foreground">
                  Requested {new Date(member.joinedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApprove(member.userId)}
                className="text-green-600 hover:bg-green-50"
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleReject(member.userId)}
                className="text-destructive hover:bg-destructive/10"
              >
                <X className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
