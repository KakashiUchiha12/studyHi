"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Settings, MessageSquare, FileText, Users, Info } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Class, ClassRole } from "@/types/classes"
import { ClassHeader } from "@/components/classes/class-header"
import { StreamTab } from "@/components/classes/stream-tab"
import { AssignmentsTab } from "@/components/classes/assignments-tab"
import { PeopleTab } from "@/components/classes/people-tab"
import { AboutTab } from "@/components/classes/about-tab"
import { SettingsTab } from "@/components/classes/settings-tab"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClassPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [classData, setClassData] = useState<Class | null>(null)
  const [userRole, setUserRole] = useState<ClassRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("stream")

  const classId = params.id as string

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated") {
      loadClass()
    }
  }, [router, status, classId])

  const loadClass = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/classes/${classId}`)

      if (response.status === 403) {
        toast.error("You don't have access to this class")
        router.push("/classes")
        return
      }

      if (!response.ok) {
        throw new Error("Failed to load class")
      }

      const data = await response.json()
      setClassData(data)
      setUserRole(data.role || data.userRole || null) // Handle both role and userRole properties from API
    } catch (error) {
      console.error("Failed to load class:", error)
      toast.error("Failed to load class")
      router.push("/classes")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-48 w-full mb-6" />
          <Skeleton className="h-12 w-full mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!classData) {
    return null
  }

  const isAdmin = userRole === "admin"
  const isTeacherOrAdmin = userRole === "admin" || userRole === "teacher"

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/classes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Classes
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <ClassHeader classData={classData} userRole={userRole} onUpdate={loadClass} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${isTeacherOrAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="stream" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Stream</span>
            </TabsTrigger>
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Assignments</span>
              {(classData as any)._count?.assignments > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                  {(classData as any)._count.assignments}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="people" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">People</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">About</span>
            </TabsTrigger>
            {isTeacherOrAdmin && (
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="stream" className="space-y-4">
            <StreamTab
              classId={classId}
              userRole={userRole}
              allowStudentPosts={classData.allowStudentPosts}
              allowComments={classData.allowComments}
            />
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <AssignmentsTab
              classId={classId}
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="people" className="space-y-4">
            <PeopleTab
              classId={classId}
              userRole={userRole}
              onUpdate={loadClass}
            />
          </TabsContent>

          <TabsContent value="about" className="space-y-4">
            <AboutTab
              classData={classData}
              userRole={userRole}
              onUpdate={loadClass}
            />
          </TabsContent>

          {isTeacherOrAdmin && (
            <TabsContent value="settings" className="space-y-4">
              <SettingsTab
                classData={classData}
                onUpdate={loadClass}
              />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
