"use client"

import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Plus,
  GripVertical,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Save,
  Image as ImageIcon,
  Link as LinkIcon,
  Video,
  Upload,
  Loader2,
  FileSpreadsheet,
  Check,
  Paperclip,
  FileText,
  ArrowLeft
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QuizCSVImportDialog } from '@/components/courses/QuizCSVImportDialog'
import { CourseCSVImportDialog } from '@/components/courses/CourseCSVImportDialog'
import { QuizBuilder } from '@/components/courses/QuizBuilder'
import { PDFThumbnail } from '@/components/pdf-thumbnail'

const ImageIcon2 = ImageIcon

// Constants for subfolders
const UPLOAD_SUBFOLDERS = {
  module: 'courses/modules',
  section: 'courses/sections'
}

interface Section {
  id: string
  title: string
  content: string
  order: number
  duration?: number
  sectionType: 'video' | 'text' | 'quiz' | 'assignment'
  videoUrl?: string
  imageUrl?: string
  images?: string[]
  attachments?: string[]
  quiz?: QuizData
}

interface QuizQuestionData {
  id: string
  question: string
  options: string[]
  correctAnswers: string[]
  explanation?: string
  order: number
}

interface QuizData {
  id?: string
  title: string
  description?: string
  passingScore?: number
  questions: QuizQuestionData[]
}

interface Chapter {
  id: string
  title: string
  description: string
  order: number
  duration?: number
  sections: Section[]
}

interface Module {
  id: string
  title: string
  description: string
  order: number
  duration?: number
  moduleImage?: string
  chapters: Chapter[]
}

// YouTube URL parser
function getYouTubeEmbedUrl(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const match = url.match(regExp)
  const videoId = match && match[2].length === 11 ? match[2] : null
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url
}

// Sortable Item Component
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center gap-2">
        <div {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        {children}
      </div>
    </div>
  )
}

export default function ContentManagementPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.id as string

  const [modules, setModules] = useState<Module[]>([])
  const [courseTitle, setCourseTitle] = useState('Course Content')
  const [courseStatus, setCourseStatus] = useState('draft')
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [editingItem, setEditingItem] = useState<{ type: 'module' | 'chapter' | 'section'; item: any; moduleId?: string; chapterId?: string } | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCSVImportOpen, setIsCSVImportOpen] = useState(false)
  const [isCourseCSVImportOpen, setIsCourseCSVImportOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Normalize data helper to handle JSON strings from server
  const normalizeData = (data: any[]): Module[] => {
    return data.map((m: any) => ({
      ...m,
      chapters: m.chapters.map((c: any) => ({
        ...c,
        sections: c.sections.map((s: any) => ({
          ...s,
          quiz: s.quiz ? {
            ...s.quiz,
            questions: s.quiz.questions.map((q: any) => ({
              ...q,
              options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
              correctAnswers: typeof q.correctAnswers === 'string' ? JSON.parse(q.correctAnswers) : q.correctAnswers
            }))
          } : undefined,
          images: typeof s.images === 'string' ? JSON.parse(s.images) : (Array.isArray(s.images) ? s.images : []),
          attachments: typeof s.attachments === 'string' ? JSON.parse(s.attachments) : (Array.isArray(s.attachments) ? s.attachments : [])
        }))
      }))
    }))
  }

  // Fetch course content on mount
  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Fetch Course Details for the title and status
        const courseRes = await fetch(`/api/courses/${courseId}`)
        if (courseRes.ok) {
          const courseData = await courseRes.json()
          setCourseTitle(courseData.title)
          setCourseStatus(courseData.status || 'draft')
        }

        const response = await fetch(`/api/courses/${courseId}/content`)
        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0) {
            const normalizedData = normalizeData(data)
            setModules(normalizedData)
            setExpandedModules(new Set([data[0].id]))
          } else {
            setModules([])
          }
        }
      } catch (error) {
        console.error('Failed to fetch content:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchContent()
  }, [courseId])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editingItem) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    // Determine subfolder based on editing item type
    const subfolder = editingItem.type === 'module'
      ? UPLOAD_SUBFOLDERS.module
      : UPLOAD_SUBFOLDERS.section
    formData.append('subfolder', subfolder)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        const fileUrl = data.url
        const isImage = file.type.startsWith('image/')

        setEditingItem((prev) => {
          if (!prev) return null
          const item = { ...prev.item } as Section

          if (prev.type === 'module') {
            (item as any).moduleImage = fileUrl
          } else if (prev.type === 'section') {
            if (isImage) {
              const currentImages = Array.isArray(item.images) ? item.images : []
              item.images = [...currentImages, fileUrl]
              if (!item.imageUrl) item.imageUrl = fileUrl
            } else {
              const currentAttachments = Array.isArray(item.attachments) ? item.attachments : []
              item.attachments = [...currentAttachments, fileUrl]
            }
          }

          return { ...prev, item }
        })
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const triggerUpload = () => {
    fileInputRef.current?.click()
  }

  // Toggle expand/collapse
  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules)
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId)
    } else {
      newExpanded.add(moduleId)
    }
    setExpandedModules(newExpanded)
  }

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters)
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId)
    } else {
      newExpanded.add(chapterId)
    }
    setExpandedChapters(newExpanded)
  }

  // Drag and drop handlers
  const handleModuleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setModules((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const reordered = arrayMove(items, oldIndex, newIndex)
        return reordered.map((item, index) => ({ ...item, order: index }))
      })
    }
  }

  const handleChapterDragEnd = (moduleId: string, event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setModules((modules) =>
        modules.map((module) => {
          if (module.id === moduleId) {
            const oldIndex = module.chapters.findIndex((item) => item.id === active.id)
            const newIndex = module.chapters.findIndex((item) => item.id === over.id)
            const reordered = arrayMove(module.chapters, oldIndex, newIndex)
            return {
              ...module,
              chapters: reordered.map((item, index) => ({ ...item, order: index })),
            }
          }
          return module
        })
      )
    }
  }

  const handleSectionDragEnd = (moduleId: string, chapterId: string, event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setModules((modules) =>
        modules.map((module) => {
          if (module.id === moduleId) {
            return {
              ...module,
              chapters: module.chapters.map((chapter) => {
                if (chapter.id === chapterId) {
                  const oldIndex = chapter.sections.findIndex((item) => item.id === active.id)
                  const newIndex = chapter.sections.findIndex((item) => item.id === over.id)
                  const reordered = arrayMove(chapter.sections, oldIndex, newIndex)
                  return {
                    ...chapter,
                    sections: reordered.map((item, index) => ({ ...item, order: index })),
                  }
                }
                return chapter
              }),
            }
          }
          return module
        })
      )
    }
  }

  // CRUD operations
  const addModule = () => {
    const newModule: Module = {
      id: Date.now().toString(),
      title: 'New Module',
      description: '',
      order: modules.length,
      chapters: [],
    }
    setModules([...modules, newModule])
    setEditingItem({ type: 'module', item: newModule })
    setIsDialogOpen(true)
  }

  const addChapter = (moduleId: string) => {
    setModules((modules) =>
      modules.map((module) => {
        if (module.id === moduleId) {
          const newChapter: Chapter = {
            id: `${moduleId}-${Date.now()}`,
            title: 'New Chapter',
            description: '',
            order: module.chapters.length,
            sections: [],
          }
          return {
            ...module,
            chapters: [...module.chapters, newChapter],
          }
        }
        return module
      })
    )
  }

  const addSection = (moduleId: string, chapterId: string) => {
    setModules((modules) =>
      modules.map((module) => {
        if (module.id === moduleId) {
          return {
            ...module,
            chapters: module.chapters.map((chapter) => {
              if (chapter.id === chapterId) {
                const newSection: Section = {
                  id: `${chapterId}-${Date.now()}`,
                  title: 'New Section',
                  content: '',
                  order: chapter.sections.length,
                  duration: 0,
                  sectionType: 'video',
                  quiz: {
                    title: 'New Quiz',
                    questions: []
                  }
                }
                return {
                  ...chapter,
                  sections: [...chapter.sections, newSection],
                }
              }
              return chapter
            }),
          }
        }
        return module
      })
    )
  }

  const deleteModule = (moduleId: string) => {
    setModules((modules) => modules.filter((m) => m.id !== moduleId))
  }

  const deleteChapter = (moduleId: string, chapterId: string) => {
    setModules((modules) =>
      modules.map((module) => {
        if (module.id === moduleId) {
          return {
            ...module,
            chapters: module.chapters.filter((c) => c.id !== chapterId),
          }
        }
        return module
      })
    )
  }

  const deleteSection = (moduleId: string, chapterId: string, sectionId: string) => {
    setModules((modules) =>
      modules.map((module) => {
        if (module.id === moduleId) {
          return {
            ...module,
            chapters: module.chapters.map((chapter) => {
              if (chapter.id === chapterId) {
                return {
                  ...chapter,
                  sections: chapter.sections.filter((s) => s.id !== sectionId),
                }
              }
              return chapter
            }),
          }
        }
        return module
      })
    )
  }

  const saveChanges = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/courses/${courseId}/content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules })
      })

      if (response.ok) {
        const result = await response.json()
        const normalized = normalizeData(result.modules)
        setModules(normalized)
        alert('Changes saved successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to save changes: ${error.details || error.error}`)
      }
    } catch (error) {
      console.error('Saving failed:', error)
      alert('An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  const saveEditedItem = () => {
    if (!editingItem) return

    if (editingItem.type === 'module') {
      setModules((modules) =>
        modules.map((m) => (m.id === editingItem.item.id ? editingItem.item : m))
      )
    } else if (editingItem.type === 'chapter' && editingItem.moduleId) {
      setModules((modules) =>
        modules.map((module) => {
          if (module.id === editingItem.moduleId) {
            return {
              ...module,
              chapters: module.chapters.map((c) =>
                c.id === editingItem.item.id ? editingItem.item : c
              ),
            }
          }
          return module
        })
      )
    } else if (editingItem.type === 'section' && editingItem.moduleId && editingItem.chapterId) {
      setModules((modules) =>
        modules.map((module) => {
          if (module.id === editingItem.moduleId) {
            return {
              ...module,
              chapters: module.chapters.map((chapter) => {
                if (chapter.id === editingItem.chapterId) {
                  return {
                    ...chapter,
                    sections: chapter.sections.map((s) =>
                      s.id === editingItem.item.id ? editingItem.item : s
                    ),
                  }
                }
                return chapter
              }),
            }
          }
          return module
        })
      )
    }

    setIsDialogOpen(false)
    setEditingItem(null)
    setIsDialogOpen(false)
    setEditingItem(null)
  }

  const handleCourseImport = async (parsedData: any) => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/courses/${courseId}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules: parsedData.modules })
      });

      if (response.ok) {
        const res = await response.json();
        alert(`Successfully imported ${res.count} items!`);
        // Refresh data
        const contentRes = await fetch(`/api/courses/${courseId}/content`);
        if (contentRes.ok) {
          const data = await contentRes.json();
          if (data && data.length > 0) {
            setModules(normalizeData(data));
          }
        }
      } else {
        alert('Import failed');
      }
    } catch (e) {
      console.error(e);
      alert('Import error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
      <div className="border-b bg-card sticky top-0 z-20 shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-4">
              <Link href="/courses/instructor">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold line-clamp-1">{courseTitle}</h1>
              <Badge variant={courseStatus === 'published' ? 'default' : 'secondary'}>
                {courseStatus.charAt(0).toUpperCase() + courseStatus.slice(1)}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setIsCourseCSVImportOpen(true)} variant="outline" className="gap-2 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-700 text-green-600">
                <FileSpreadsheet className="h-4 w-4" />
                Import CSV
              </Button>
              <Button onClick={saveChanges} disabled={isSaving} className="gap-2">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </div>
          <div className="flex gap-8">
            <Link
              href={`/courses/instructor/${courseId}/edit`}
              className="px-4 py-3 border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-colors"
            >
              Basic Details
            </Link>
            <Link
              href={`/courses/instructor/${courseId}/content`}
              className="px-4 py-3 border-b-2 border-primary text-primary font-medium"
            >
              Curriculum
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6">
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
        />

        <QuizCSVImportDialog
          open={isCSVImportOpen}
          onOpenChange={setIsCSVImportOpen}
          onImport={(parsedQuestions) => {
            if (!editingItem || editingItem.type !== 'section') return;

            const newQuestions: QuizQuestionData[] = parsedQuestions.map((pq, idx) => ({
              id: `new-q-${Date.now()}-${idx}`,
              question: pq.question,
              options: pq.options,
              correctAnswers: pq.correctAnswers,
              explanation: pq.explanation,
              order: (editingItem.item.quiz?.questions?.length || 0) + idx
            }));

            const updatedQuiz = {
              ...editingItem.item.quiz,
              questions: [...(editingItem.item.quiz?.questions || []), ...newQuestions]
            };

            setEditingItem({
              ...editingItem,
              item: { ...editingItem.item, quiz: updatedQuiz }
            });
          }}
        />

        <CourseCSVImportDialog
          open={isCourseCSVImportOpen}
          onOpenChange={setIsCourseCSVImportOpen}
          onImport={handleCourseImport}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium text-lg">Loading Course Structure...</p>
          </div>
        ) : modules.length === 0 ? (
          <Card className="p-20 text-center border-dashed border-2 flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold">No Modules Yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Your course currently has no content. Start by adding your first module.
              </p>
            </div>
            <Button onClick={addModule} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Add Module
            </Button>
          </Card>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
            <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {modules.map((module) => (
                  <SortableItem key={module.id} id={module.id}>
                    <Card className="flex-1">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleModule(module.id)}
                            >
                              {expandedModules.has(module.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-lg">{module.title}</CardTitle>
                                {module.moduleImage && (
                                  <div className="h-10 w-10 rounded overflow-hidden border border-border">
                                    <img
                                      src={module.moduleImage}
                                      alt={module.title}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{module.description}</p>
                            </div>
                            <Badge variant="secondary">{module.chapters.length} chapters</Badge>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingItem({ type: 'module', item: module })
                                setIsDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteModule(module.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addChapter(module.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {expandedModules.has(module.id) && (
                        <CardContent>
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => handleChapterDragEnd(module.id, event)}
                          >
                            <SortableContext
                              items={module.chapters.map((c) => c.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <div className="space-y-3 ml-8">
                                {module.chapters.map((chapter) => (
                                  <SortableItem key={chapter.id} id={chapter.id}>
                                    <Card className="flex-1">
                                      <CardHeader className="py-3">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3 flex-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => toggleChapter(chapter.id)}
                                            >
                                              {expandedChapters.has(chapter.id) ? (
                                                <ChevronDown className="h-4 w-4" />
                                              ) : (
                                                <ChevronRight className="h-4 w-4" />
                                              )}
                                            </Button>
                                            <div className="flex-1">
                                              <h4 className="font-semibold">{chapter.title}</h4>
                                              <p className="text-xs text-muted-foreground">{chapter.description}</p>
                                            </div>
                                            <Badge variant="outline">{chapter.sections.length} sections</Badge>
                                          </div>
                                          <div className="flex gap-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setEditingItem({ type: 'chapter', item: chapter, moduleId: module.id })
                                                setIsDialogOpen(true)
                                              }}
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => deleteChapter(module.id, chapter.id)}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => addSection(module.id, chapter.id)}
                                            >
                                              <Plus className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </CardHeader>

                                      {expandedChapters.has(chapter.id) && (
                                        <CardContent className="py-3">
                                          <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={(event) => handleSectionDragEnd(module.id, chapter.id, event)}
                                          >
                                            <SortableContext
                                              items={chapter.sections.map((s) => s.id)}
                                              strategy={verticalListSortingStrategy}
                                            >
                                              <div className="space-y-2 ml-8">
                                                {chapter.sections.map((section) => (
                                                  <SortableItem key={section.id} id={section.id}>
                                                    <div className="flex items-center justify-between flex-1 p-3 border rounded-lg bg-background">
                                                      <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                          <p className="font-medium text-sm">{section.title}</p>
                                                          {section.sectionType === 'video' && section.videoUrl && (
                                                            <Badge variant="secondary" className="gap-1">
                                                              <Video className="h-3 w-3" />
                                                              Video
                                                            </Badge>
                                                          )}
                                                          {/* Educational Images */}
                                                          {section.images && section.images.length > 0 && (
                                                            <div className="flex -space-x-2">
                                                              {section.images.slice(0, 3).map((imgUrl, idx) => (
                                                                <div key={idx} className="h-8 w-8 rounded-full border-2 border-background overflow-hidden relative">
                                                                  <img
                                                                    src={imgUrl}
                                                                    alt={`Image ${idx + 1}`}
                                                                    className="h-full w-full object-cover"
                                                                  />
                                                                </div>
                                                              ))}
                                                              {section.images.length > 3 && (
                                                                <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium">
                                                                  +{section.images.length - 3}
                                                                </div>
                                                              )}
                                                            </div>
                                                          )}
                                                          {section.imageUrl && !section.images?.includes(section.imageUrl) && (
                                                            <div className="h-8 w-8 rounded overflow-hidden border border-border">
                                                              <img
                                                                src={section.imageUrl}
                                                                alt="Cover"
                                                                className="h-full w-full object-cover"
                                                              />
                                                            </div>
                                                          )}
                                                          {/* Attachments (PDFs & Others) */}
                                                          {section.attachments && section.attachments.length > 0 && (
                                                            <div className="flex -space-x-2">
                                                              {section.attachments.slice(0, 3).map((attUrl, idx) => (
                                                                <div key={idx} className="h-8 w-8 rounded border-2 border-background overflow-hidden relative bg-white flex items-center justify-center">
                                                                  {attUrl.toLowerCase().endsWith('.pdf') ? (
                                                                    <PDFThumbnail
                                                                      fileUrl={attUrl}
                                                                      documentId={`preview-${section.id}-${idx}`}
                                                                      className="h-full w-full object-cover"
                                                                    />
                                                                  ) : (
                                                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                                                  )}
                                                                </div>
                                                              ))}
                                                            </div>
                                                          )}
                                                        </div>
                                                        {section.duration && (
                                                          <p className="text-xs text-muted-foreground">{section.duration} min</p>
                                                        )}
                                                      </div>
                                                      <div className="flex gap-2">
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() => {
                                                            setEditingItem({
                                                              type: 'section',
                                                              item: section,
                                                              moduleId: module.id,
                                                              chapterId: chapter.id,
                                                            })
                                                            setIsDialogOpen(true)
                                                          }}
                                                        >
                                                          <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          onClick={() => deleteSection(module.id, chapter.id, section.id)}
                                                        >
                                                          <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  </SortableItem>
                                                ))}
                                              </div>
                                            </SortableContext>
                                          </DndContext>
                                        </CardContent>
                                      )}
                                    </Card>
                                  </SortableItem>
                                ))}
                              </div>
                            </SortableContext>
                          </DndContext>
                        </CardContent>
                      )}
                    </Card>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Edit {editingItem?.type === 'module' ? 'Module' : editingItem?.type === 'chapter' ? 'Chapter' : 'Section'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editingItem?.item?.title || ''}
                  onChange={(e) =>
                    setEditingItem((prev) =>
                      prev ? { ...prev, item: { ...prev.item, title: e.target.value } } : null
                    )
                  }
                />
              </div>

              {editingItem?.type !== 'section' && (
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={editingItem?.item?.description || ''}
                    onChange={(e) =>
                      setEditingItem((prev) =>
                        prev ? { ...prev, item: { ...prev.item, description: e.target.value } } : null
                      )
                    }
                  />
                </div>
              )}

              {editingItem?.type === 'module' && (
                <div>
                  <Label>Module Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="/uploads/courses/modules/image.jpg"
                      value={editingItem?.item?.moduleImage || ''}
                      readOnly
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={triggerUpload}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {editingItem?.type === 'section' && (
                <>
                  <div>
                    <Label>Section Type</Label>
                    <Select
                      value={editingItem?.item?.sectionType || 'video'}
                      onValueChange={(value) =>
                        setEditingItem((prev) => {
                          if (!prev) return null;
                          const updatedItem = { ...prev.item, sectionType: value };

                          // Initialize quiz if switching to quiz type and it doesn't exist
                          if (value === 'quiz' && !updatedItem.quiz) {
                            updatedItem.quiz = { title: updatedItem.title || 'New Quiz', questions: [] };
                          }

                          return { ...prev, item: updatedItem };
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="text">Text/Article</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Tabs defaultValue="content">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="media">Media</TabsTrigger>
                      {editingItem?.item?.sectionType === 'quiz' && <TabsTrigger value="quiz" className="bg-primary/5 text-primary font-bold">Quiz Builder</TabsTrigger>}
                      <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-4">
                      <div>
                        <Label>Content (Markdown supported)</Label>
                        <Textarea
                          rows={10}
                          value={editingItem?.item?.content || ''}
                          onChange={(e) =>
                            setEditingItem((prev) =>
                              prev ? { ...prev, item: { ...prev.item, content: e.target.value } } : null
                            )
                          }
                          placeholder="# Section Title&#10;&#10;Your content here..."
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="media" className="space-y-4">
                      {editingItem?.item?.sectionType === 'video' && (
                        <div>
                          <Label>YouTube Video URL</Label>
                          <Input
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={editingItem?.item?.videoUrl || ''}
                            onChange={(e) =>
                              setEditingItem((prev) =>
                                prev ? { ...prev, item: { ...prev.item, videoUrl: e.target.value } } : null
                              )
                            }
                          />
                          {editingItem?.item?.videoUrl && (
                            <div className="mt-4 aspect-video">
                              <iframe
                                className="w-full h-full rounded-lg"
                                src={getYouTubeEmbedUrl(editingItem.item.videoUrl)}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-6">
                        {/* Images Gallery */}
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2">
                            <ImageIcon2 className="h-4 w-4" />
                            Section Images Gallery
                          </Label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {editingItem?.item?.images?.map((img, idx) => (
                              <div key={idx} className="relative aspect-video group border rounded-lg overflow-hidden bg-muted">
                                <img src={img} alt={`Media ${idx}`} className="w-full h-full object-cover" />
                                <button
                                  onClick={() => {
                                    setEditingItem(prev => {
                                      if (!prev) return null
                                      const item = { ...prev.item } as Section
                                      item.images = (item.images || []).filter((_, i) => i !== idx)
                                      // Update leading imageUrl if it was this one
                                      if (item.imageUrl === img) item.imageUrl = item.images[0] || ''
                                      return { ...prev, item }
                                    })
                                  }}
                                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={triggerUpload}
                              className="aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center hover:bg-muted transition-colors gap-1 text-muted-foreground"
                            >
                              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                              <span className="text-[10px] font-medium">Add Image</span>
                            </button>
                          </div>
                        </div>

                        {/* Attachments Section */}
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            Course Attachments (PDF, PPT, DOCX)
                          </Label>
                          <div className="grid gap-3">
                            {editingItem?.item?.attachments?.map((file, idx) => {
                              const isPDF = file.toLowerCase().endsWith('.pdf')
                              return (
                                <div key={idx} className="flex items-center gap-4 p-3 border rounded-lg bg-card group">
                                  <div className="h-16 w-12 bg-muted rounded overflow-hidden flex-shrink-0 border">
                                    {isPDF ? (
                                      <PDFThumbnail
                                        documentId={`section-${editingItem.item.id}-${idx}`}
                                        fileUrl={file}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-blue-50">
                                        <FileText className="h-6 w-6 text-blue-500" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{file.split('/').pop()}</p>
                                    <p className="text-xs text-muted-foreground uppercase">{file.split('.').pop()} File</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => {
                                        setEditingItem(prev => {
                                          if (!prev) return null
                                          const item = { ...prev.item } as Section
                                          item.attachments = (item.attachments || []).filter((_, i) => i !== idx)
                                          return { ...prev, item }
                                        })
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )
                            }
                            )}
                            <Button
                              variant="outline"
                              className="w-full border-dashed"
                              onClick={triggerUpload}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="mr-2 h-4 w-4" />
                              )}
                              Upload File Attachment
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-4">
                      <div>
                        <Label>Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={editingItem?.item?.duration || 0}
                          onChange={(e) =>
                            setEditingItem((prev) =>
                              prev ? { ...prev, item: { ...prev.item, duration: parseInt(e.target.value) } } : null
                            )
                          }
                        />
                      </div>
                    </TabsContent>

                    {editingItem?.item?.sectionType === 'quiz' && (
                      <TabsContent value="quiz" className="space-y-6">
                        {editingItem.item.quiz ? (
                          <QuizBuilder
                            quiz={editingItem.item.quiz}
                            onUpdate={(questions) => {
                              setEditingItem({
                                ...editingItem,
                                item: {
                                  ...editingItem.item,
                                  quiz: { ...editingItem.item.quiz, questions }
                                }
                              })
                            }}
                            onImportCSV={() => setIsCSVImportOpen(true)}
                          />
                        ) : (
                          <div className="text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed">
                            <p className="text-muted-foreground italic">Quiz data initialization error. Please re-select Section Type.</p>
                          </div>
                        )}
                      </TabsContent>
                    )}
                  </Tabs>
                </>
              )}

              {editingItem?.type !== 'section' && (
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={editingItem?.item?.duration || 0}
                    onChange={(e) =>
                      setEditingItem((prev) =>
                        prev ? { ...prev, item: { ...prev.item, duration: parseInt(e.target.value) } } : null
                      )
                    }
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={saveEditedItem}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
