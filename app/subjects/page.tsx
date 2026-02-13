"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Search, Plus, Edit, Trash2, Eye, ArrowLeft, GripVertical } from "lucide-react"
import { AddSubjectDialog } from "@/components/subjects/add-subject-dialog"
import { EditSubjectDialog } from "@/components/subjects/edit-subject-dialog"
import { DeleteSubjectDialog } from "@/components/subjects/delete-subject-dialog"
import { SubjectDetailDialog } from "@/components/subjects/subject-detail-dialog"

import Link from "next/link"
import { useSubjects, useMigration } from "@/hooks"
import { Subject } from "@prisma/client"
import { notifyDataUpdate } from "@/lib/data-sync"
import { getColorHex } from "@/lib/utils/colors"
import { FileUploadSimple } from '@/components/subjects/file-upload-simple'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { SortableSubjectCard } from "@/components/subjects/sortable-subject-card"

export default function SubjectsPage() {
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [dialogState, setDialogState] = useState<{
    add: boolean
    edit: boolean
    delete: boolean
    detail: boolean
  }>({
    add: false,
    edit: false,
    delete: false,
    detail: false,
  })
  const router = useRouter()

  // Use database hooks
  const {
    subjects,
    loading: subjectsLoading,
    error: subjectsError,
    createSubject,
    updateSubject,
    deleteSubject,
    refreshSubjects
  } = useSubjects()

  // Local state for optimistic updates
  const [localSubjects, setLocalSubjects] = useState<Subject[]>([])
  const [isReordering, setIsReordering] = useState(false)

  const { autoMigrateIfNeeded } = useMigration()

  useEffect(() => {
    // Check authentication using NextAuth
    if (status === "loading") return // Wait for session to load

    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    // Auto-migrate data if needed
    if (status === "authenticated") {
      autoMigrateIfNeeded()
    }
  }, [router, status, autoMigrateIfNeeded])

  // Sync local subjects with fetched subjects
  useEffect(() => {
    if (subjects.length > 0 && !isReordering) {
      // Sort by order before setting local state
      const sortedSubjects = [...subjects].sort((a, b) => (a.order || 0) - (b.order || 0))
      setLocalSubjects(sortedSubjects)
    }
  }, [subjects, isReordering])

  // Listen for subject updates from other components
  useEffect(() => {
    const handleSubjectUpdate = () => {
      refreshSubjects()
    }

    window.addEventListener('subject-updated', handleSubjectUpdate)

    return () => {
      window.removeEventListener('subject-updated', handleSubjectUpdate)
    }
  }, [refreshSubjects])

  // Dnd Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setIsReordering(true)

      setLocalSubjects((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        const newItems = arrayMove(items, oldIndex, newIndex)

        // Update the backend
        const updatePromises = newItems.map((subject, index) => {
          return updateSubject(subject.id, { order: index })
        })

        Promise.all(updatePromises).finally(() => {
          setIsReordering(false)
          refreshSubjects()
        })

        return newItems
      })
    }
  }

  // Show loading state while checking authentication
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

  // Show loading state while loading subjects (only after authentication is confirmed)
  if (status === "authenticated" && subjectsLoading && localSubjects.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading subjects...</p>
        </div>
      </div>
    )
  }

  // Show sign-in prompt if not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view subjects</h1>
          <Button onClick={() => router.push("/auth/login")}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  const filteredSubjects = localSubjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (subject.description && subject.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleAddSubject = async (newSubject: Omit<Subject, "id">) => {
    try {
      await createSubject({
        name: newSubject.name,
        color: newSubject.color,
        description: newSubject.description || '',
        code: newSubject.code || '',
        credits: newSubject.credits || 3,
        instructor: newSubject.instructor || '',
        totalChapters: newSubject.totalChapters || 0,
        completedChapters: newSubject.completedChapters || 0,
        progress: newSubject.progress || 0,
        nextExam: newSubject.nextExam || null,
        assignmentsDue: newSubject.assignmentsDue || 0
      })

      // Notify other pages to refresh their data
      notifyDataUpdate.subject()

      setDialogState({ ...dialogState, add: false })
    } catch (error) {
      console.error('Failed to create subject:', error)
      // Error handling is managed by the hook
    }
  }

  const handleEditSubject = async (updatedSubject: Subject) => {
    try {
      await updateSubject(updatedSubject.id, {
        name: updatedSubject.name,
        color: updatedSubject.color,
        description: updatedSubject.description || '',
        code: updatedSubject.code || '',
        credits: updatedSubject.credits || 3,
        instructor: updatedSubject.instructor || '',
        totalChapters: updatedSubject.totalChapters || 0,
        completedChapters: updatedSubject.completedChapters || 0,
        progress: updatedSubject.progress || 0,
        nextExam: updatedSubject.nextExam || undefined,
        assignmentsDue: updatedSubject.assignmentsDue || 0
      })

      // Notify other pages to refresh their data
      notifyDataUpdate.subject()

      setDialogState({ ...dialogState, edit: false })
      setSelectedSubject(null)
    } catch (error) {
      console.error('Failed to update subject:', error)
      // Error handling is managed by the hook
    }
  }

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      await deleteSubject(subjectId)

      // Notify other pages to refresh their data
      notifyDataUpdate.subject()

      setDialogState({ ...dialogState, delete: false })
      setSelectedSubject(null)
    } catch (error) {
      console.error('Failed to delete subject:', error)
      // Error handling is managed by the hook
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Error Display */}
      {subjectsError && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
            <p className="text-sm text-destructive">{subjectsError}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10 transition-all">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
              <Link href="/dashboard" className="flex-shrink-0">
                <Button variant="ghost" size="sm" className="px-2 sm:px-4">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center gap-2 overflow-hidden">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
                <span className="text-lg sm:text-xl font-bold text-foreground truncate">Subjects</span>
              </div>
            </div>

            <div className="flex items-center flex-shrink-0">
              <Button onClick={() => setDialogState({ ...dialogState, add: true })} size="sm" className="h-9 px-3 sm:px-4">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Subject</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        {/* Search and Stats */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Subjects</h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">Manage your subjects and track your academic progress</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10"
              />
            </div>
            <Badge variant="secondary" className="text-sm whitespace-nowrap">
              {subjects.length} <span className="hidden sm:inline ml-1">subjects</span>
            </Badge>
          </div>
        </div>

        {/* Subjects Grid */}
        {filteredSubjects.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery ? "No subjects found" : "Ready to Organize Your Studies?"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search terms" : "Create subjects to organize your study sessions, track progress, and get detailed analytics. Start with subjects like 'Mathematics', 'Physics', or 'Literature'."}
              </p>
              {!searchQuery && (
                <Button onClick={() => setDialogState({ ...dialogState, add: true })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Subject
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredSubjects.map((s) => s.id)}
              strategy={rectSortingStrategy}
            >
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredSubjects.map((subject) => (
                  <SortableSubjectCard
                    key={subject.id}
                    subject={subject}
                    onView={(s) => {
                      setSelectedSubject(s)
                      setDialogState({ ...dialogState, detail: true })
                    }}
                    onEdit={(s) => {
                      setSelectedSubject(s)
                      setDialogState({ ...dialogState, edit: true })
                    }}
                    onDelete={(s) => {
                      setSelectedSubject(s)
                      setDialogState({ ...dialogState, delete: true })
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {/* Dialogs */}
      <AddSubjectDialog
        open={dialogState.add}
        onOpenChange={(open) => setDialogState({ ...dialogState, add: open })}
        onAddSubject={handleAddSubject as any}
      />

      {selectedSubject && (
        <>
          <EditSubjectDialog
            open={dialogState.edit}
            onOpenChange={(open) => setDialogState({ ...dialogState, edit: open })}
            subject={selectedSubject as any}
            onEditSubject={handleEditSubject as any}
          />

          <DeleteSubjectDialog
            open={dialogState.delete}
            onOpenChange={(open) => setDialogState({ ...dialogState, delete: open })}
            subject={selectedSubject as any}
            onDeleteSubject={handleDeleteSubject}
          />

          <SubjectDetailDialog
            open={dialogState.detail}
            onOpenChange={(open) => setDialogState({ ...dialogState, detail: open })}
            subject={selectedSubject as any}
          />
        </>
      )}
    </div>
  )
}
