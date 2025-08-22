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
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"
import { Subject } from "@/types"

export default function SubjectsPage() {
  const { data: session, status } = useSession()
  const [subjects, setSubjects] = useState<Subject[]>([])
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
  const [draggedSubject, setDraggedSubject] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check authentication using NextAuth
    if (status === "loading") return // Wait for session to load
    
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    // Load subjects from localStorage or initialize with sample data
    const savedSubjects = localStorage.getItem("subjects")
    if (savedSubjects) {
      try {
        setSubjects(JSON.parse(savedSubjects))
      } catch (error) {
        console.error('Failed to parse saved subjects:', error)
        // Clear corrupted data
        localStorage.removeItem("subjects")
        setSubjects([])
      }
    } else {
      // No subjects exist - start with empty array
      setSubjects([])
    }
  }, [router, status])

  // Show loading state while checking authentication
  if (status === "loading") {
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

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchQuery.toLowerCase())
  )



  const handleAddSubject = (newSubject: Omit<Subject, "id">) => {
    const subject: Subject = {
      ...newSubject,
      id: `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      progress: 0,
      nextExam: undefined,
      assignmentsDue: 0,
      materials: [],
      topics: [],
      totalChapters: 0,
      completedChapters: 0
    }
    const updatedSubjects = [...subjects, subject]
    setSubjects(updatedSubjects)
    localStorage.setItem("subjects", JSON.stringify(updatedSubjects))
    setDialogState({ ...dialogState, add: false })
  }

  const handleEditSubject = (updatedSubject: Subject) => {
    const updatedSubjects = subjects.map((subject) => (subject.id === updatedSubject.id ? updatedSubject : subject))
    setSubjects(updatedSubjects)
    localStorage.setItem("subjects", JSON.stringify(updatedSubjects))
    setDialogState({ ...dialogState, edit: false })
    setSelectedSubject(null)
  }

  const handleDeleteSubject = (subjectId: string) => {
    const updatedSubjects = subjects.filter((subject) => subject.id !== subjectId)
    setSubjects(updatedSubjects)
    localStorage.setItem("subjects", JSON.stringify(updatedSubjects))
    setDialogState({ ...dialogState, delete: false })
    setSelectedSubject(null)
  }

  const handleDragStart = (e: React.DragEvent, subjectId: string) => {
    setDraggedSubject(subjectId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (!draggedSubject) return

    const draggedIndex = filteredSubjects.findIndex((subject) => subject.id === draggedSubject)
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedSubject(null)
      setDragOverIndex(null)
      return
    }

    const newSubjects = [...filteredSubjects]
    const [draggedItem] = newSubjects.splice(draggedIndex, 1)
    newSubjects.splice(dropIndex, 0, draggedItem)

    setSubjects(newSubjects)
    localStorage.setItem("subjects", JSON.stringify(newSubjects))
    setDraggedSubject(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedSubject(null)
    setDragOverIndex(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                <span className="text-xl font-bold text-foreground">Subjects</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button onClick={() => setDialogState({ ...dialogState, add: true })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Stats */}
        <div className="mb-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Subjects</h1>
            <p className="mt-2 text-muted-foreground">Manage your subjects and track your academic progress</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10"
              />
            </div>
            <Badge variant="secondary" className="text-sm">
              {subjects.length} subjects
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSubjects.map((subject, index) => (
              <Card
                key={subject.id}
                className={`hover:shadow-md transition-all ${
                  draggedSubject === subject.id ? "opacity-50 scale-95" : ""
                } ${dragOverIndex === index ? "ring-2 ring-primary ring-offset-2" : ""}`}
                draggable
                onDragStart={(e) => handleDragStart(e, subject.id)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="group/drag p-1 -ml-1 rounded hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4 text-muted-foreground transition-opacity" />
                      </div>
                      <div className={`h-3 w-3 rounded-full ${subject.color}`} />
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSubject(subject)
                          setDialogState({ ...dialogState, detail: true })
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSubject(subject)
                          setDialogState({ ...dialogState, edit: true })
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSubject(subject)
                          setDialogState({ ...dialogState, delete: true })
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {subject.code || "No code provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{subject.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{ 
                            width: `${subject.progress}%`,
                            backgroundColor: subject.color && subject.color.startsWith('#') ? subject.color : undefined
                          }}
                        />
                      </div>
                    </div>

                    {/* Chapters */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Chapters</span>
                      <span className="font-medium">
                        {subject.completedChapters || 0}/{subject.totalChapters || 0}
                      </span>
                    </div>

                    {/* Materials */}
                    <div>
                      <span className="text-sm text-muted-foreground">Materials</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {subject.materials && subject.materials.length > 0 ? (
                          <>
                            {subject.materials.slice(0, 2).map((material, index) => {
                              const materialName = typeof material === 'string' ? material : 
                                (material && typeof material === 'object' && 'name' in material ? (material as any).name : 'Unknown');
                              const displayName = materialName.length > 20 ? `${materialName.substring(0, 20)}...` : materialName;
                              
                              return (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {displayName}
                                </Badge>
                              );
                            })}
                            {subject.materials.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{subject.materials.length - 2} more
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">No materials added</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
