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
    (cls.description && cls.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    ((cls as any).subject && (cls as any).subject.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="text-lg sm:text-xl font-bold text-foreground">Classes</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setJoinModalOpen(true)}
                className="px-2 sm:px-4"
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Join</span>
              </Button>
              <Button
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="px-2 sm:px-4"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Create</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-4 sm:mb-8 space-y-3 sm:space-y-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Classes</h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-muted-foreground">
              Manage your classes, assignments, and collaborate with classmates
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10"
              />
            </div>
            <Badge variant="secondary" className="py-1.5 self-start sm:self-auto">
              {filteredClasses.length} {filteredClasses.length === 1 ? 'class' : 'classes'}
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
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
            <FolderOpen className="h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">
              {searchQuery ? 'No classes found' : 'No classes yet'}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md">
              {searchQuery
                ? `No classes match "${searchQuery}". Try a different search term.`
                : 'Get started by creating your first class or join an existing one.'}
            </p>
            {!searchQuery && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => setCreateModalOpen(true)} size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Class
                </Button>
                <Button onClick={() => setJoinModalOpen(true)} variant="outline" size="lg">
                  <Users className="h-5 w-5 mr-2" />
                  Join Class
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
