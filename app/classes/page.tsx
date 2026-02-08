"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Search, Plus, Users, ArrowLeft, FolderOpen } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Class } from "@/types/classes"
import { ClassCard } from "@/components/classes/class-card"
import { CreateClassModal } from "@/components/classes/create-class-modal"
import { JoinClassModal } from "@/components/classes/join-class-modal"
import { Skeleton } from "@/components/ui/skeleton"

export default function ClassesPage() {
  const { data: session, status } = useSession()
  const [classes, setClasses] = useState<Class[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [joinModalOpen, setJoinModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (status === "authenticated") {
      loadClasses()
    }
  }, [router, status])

  const loadClasses = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/classes")
      
      if (!response.ok) {
        throw new Error("Failed to load classes")
      }

      const data = await response.json()
      setClasses(data)
    } catch (error) {
      console.error("Failed to load classes:", error)
      toast.error("Failed to load classes")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClass = async (classData: {
    name: string
    description: string
    coverImage: string
    syllabus?: string
    allowStudentPosts?: boolean
    allowComments?: boolean
  }) => {
    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classData),
      })

      if (!response.ok) {
        throw new Error("Failed to create class")
      }

      const newClass = await response.json()
      toast.success("Class created successfully!")
      setCreateModalOpen(false)
      loadClasses()
    } catch (error) {
      console.error("Failed to create class:", error)
      toast.error("Failed to create class")
    }
  }

  const handleJoinClass = async (code: string) => {
    try {
      const previewResponse = await fetch(`/api/classes/join/${code}`)
      
      if (!previewResponse.ok) {
        if (previewResponse.status === 404) {
          throw new Error("Invalid join code")
        }
        if (previewResponse.status === 410) {
          throw new Error("This class has been archived")
        }
        throw new Error("Failed to check class")
      }

      const classInfo = await previewResponse.json()

      const joinResponse = await fetch(`/api/classes/${classInfo.id}/join`, {
        method: "POST",
      })

      if (!joinResponse.ok) {
        const errorData = await joinResponse.json()
        throw new Error(errorData.error || "Failed to join class")
      }

      toast.success("Join request sent! Waiting for admin approval.")
      setJoinModalOpen(false)
      loadClasses()
    } catch (error: any) {
      console.error("Failed to join class:", error)
      toast.error(error.message || "Failed to join class")
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view classes</h1>
          <Button onClick={() => router.push("/auth/login")}>Sign In</Button>
        </div>
      </div>
    )
  }

  const filteredClasses = classes.filter((cls) =>
    cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cls.description && cls.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">Classes</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setJoinModalOpen(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Join Class
              </Button>
              <Button onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Class
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Classes</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your classes, assignments, and collaborate with classmates
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
            <Badge variant="secondary" className="text-sm">
              {classes.length} classes
            </Badge>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border bg-card p-6">
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-card">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchQuery ? "No classes found" : "No Classes Yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search terms"
                : "Create a class to get started or join an existing class with a code"}
            </p>
            {!searchQuery && (
              <div className="flex items-center justify-center gap-2">
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Class
                </Button>
                <Button variant="outline" onClick={() => setJoinModalOpen(true)}>
                  <Users className="h-4 w-4 mr-2" />
                  Join Class
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((cls) => (
              <ClassCard key={cls.id} classData={cls} />
            ))}
          </div>
        )}
      </main>

      <CreateClassModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onCreateClass={handleCreateClass}
      />

      <JoinClassModal
        open={joinModalOpen}
        onOpenChange={setJoinModalOpen}
        onJoinClass={handleJoinClass}
      />
    </div>
  )
}
