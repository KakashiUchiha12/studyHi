"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  BookOpen,
  Calendar,
  Target,
  Upload,
  Plus,
  Edit2,
  Download,
  Eye,
  Trash2,
  FileText,
  ImageIcon,
  File,
  GripVertical,
  Search,
  BookMarked,
} from "lucide-react"

interface Subject {
  id: string
  name: string
  description: string
  materials: Material[]
  color: string
  progress: number
  totalChapters: number
  completedChapters: number
  createdAt: string
  chapters?: Chapter[] // Added chapters property
}

interface Material {
  id: string
  name: string
  type: "book" | "notes" | "video" | "website" | "other"
  files: UploadedFile[]
  links: MaterialLink[] // Added links array to materials
  createdAt: string
}

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  note?: string
  uploadedAt: string
}

interface MaterialLink {
  id: string
  url: string
  description: string
  createdAt: string
}

interface Chapter {
  id: string
  name: string
  completed: boolean
  createdAt: string
}

interface SubjectDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: Subject
}

export function SubjectDetailDialog({ open, onOpenChange, subject }: SubjectDetailDialogProps) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [newChapterName, setNewChapterName] = useState("")
  const [editingChapter, setEditingChapter] = useState<string | null>(null)
  const [editingChapterName, setEditingChapterName] = useState("")
  const [draggedChapter, setDraggedChapter] = useState<string | null>(null)
  const [dragOverChapterIndex, setDragOverChapterIndex] = useState<number | null>(null)
  const [newMaterialName, setNewMaterialName] = useState("")
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null)
  const [draggedMaterial, setDraggedMaterial] = useState<string | null>(null)
  const [dragOverMaterialIndex, setDragOverMaterialIndex] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [newLinkUrl, setNewLinkUrl] = useState("")
  const [newLinkDescription, setNewLinkDescription] = useState("")
  const [addingLinkToMaterial, setAddingLinkToMaterial] = useState<string | null>(null)

  // Helper function to sync chapter data with main subjects list
  const syncChapterData = (updatedChapters: Chapter[]) => {
    const subjects = JSON.parse(localStorage.getItem("subjects") || "[]")
    const updatedSubjects = subjects.map((s: any) => {
      if (s.id === subject.id) {
        return {
          ...s,
          totalChapters: updatedChapters.length,
          completedChapters: updatedChapters.filter(ch => ch.completed).length,
          progress: updatedChapters.length > 0 
            ? Math.round((updatedChapters.filter(ch => ch.completed).length / updatedChapters.length) * 100)
            : 0
        }
      }
      return s
    })
    localStorage.setItem("subjects", JSON.stringify(updatedSubjects))
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('subject-updated'))
  }

  const createdDate = subject.createdAt ? new Date(subject.createdAt).toLocaleDateString() : 'Date not set'

  const completedChaptersCount = chapters.filter((chapter) => chapter.completed).length
  const progressPercentage = chapters.length > 0 ? Math.round((completedChaptersCount / chapters.length) * 100) : 0

  const filteredMaterials = materials.filter((material) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      material.name.toLowerCase().includes(query) ||
      material.files.some(
        (file) => file.name.toLowerCase().includes(query) || (file.note && file.note.toLowerCase().includes(query)),
      ) ||
      material.links.some(
        (link) => link.description.toLowerCase().includes(query) || link.url.toLowerCase().includes(query),
      )
    )
  })

  useEffect(() => {
    if (subject.id) {
      const storedChapters = JSON.parse(localStorage.getItem(`subject_chapters_${subject.id}`) || "[]")
      setChapters(storedChapters)

      const storedMaterials = JSON.parse(localStorage.getItem(`subject_materials_${subject.id}`) || "[]")
      if (storedMaterials.length > 0) {
        const migratedMaterials = storedMaterials.map((material: any) => ({
          ...material,
          files: material.file ? [material.file] : material.files || [],
          links: material.links || [], // Added links migration
        }))
        setMaterials(migratedMaterials)
      } else if (subject.materials && Array.isArray(subject.materials) && subject.materials.length > 0) {
        const convertedMaterials = subject.materials.map((material, index) => {
          if (typeof material === 'string') {
            return {
              id: `material_${Date.now()}_${index}`,
              name: material,
              type: "other" as const,
              files: [],
              links: [],
              createdAt: new Date().toISOString(),
            }
          } else {
            // Already a Material object
            return material
          }
        })
        setMaterials(convertedMaterials)
        if (convertedMaterials.length > 0) {
          localStorage.setItem(`subject_materials_${subject.id}`, JSON.stringify(convertedMaterials))
        }
      } else {
        // No materials to convert, set empty array
        setMaterials([])
      }
    }
  }, [subject.id, subject.materials, open])

  const addChapter = () => {
    if (newChapterName.trim()) {
      const newChapter: Chapter = {
        id: `chapter_${Date.now()}`,
        name: newChapterName.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      }
      const updatedChapters = [...chapters, newChapter]
      setChapters(updatedChapters)
      
      // Save chapters to localStorage
      localStorage.setItem(`subject_chapters_${subject.id}`, JSON.stringify(updatedChapters))
      
      // Sync with main subjects list
      syncChapterData(updatedChapters)
      
      setNewChapterName("")
    }
  }

  const toggleChapterCompletion = (chapterId: string) => {
    const updatedChapters = chapters.map((chapter) =>
      chapter.id === chapterId ? { ...chapter, completed: !chapter.completed } : chapter,
    )
    setChapters(updatedChapters)
    localStorage.setItem(`subject_chapters_${subject.id}`, JSON.stringify(updatedChapters))
    
    // Sync with main subjects list
    syncChapterData(updatedChapters)
  }

  const updateChapterName = (chapterId: string, newName: string) => {
    const updatedChapters = chapters.map((chapter) =>
      chapter.id === chapterId ? { ...chapter, name: newName } : chapter,
    )
    setChapters(updatedChapters)
    localStorage.setItem(`subject_chapters_${subject.id}`, JSON.stringify(updatedChapters))
    
    // Sync with main subjects list
    syncChapterData(updatedChapters)
    
    setEditingChapter(null)
  }

  const deleteChapter = (chapterId: string) => {
    const updatedChapters = chapters.filter((chapter) => chapter.id !== chapterId)
    setChapters(updatedChapters)
    localStorage.setItem(`subject_chapters_${subject.id}`, JSON.stringify(updatedChapters))
    
    // Sync with main subjects list
    syncChapterData(updatedChapters)
  }

  const handleChapterDragStart = (e: React.DragEvent, chapterId: string) => {
    setDraggedChapter(chapterId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleChapterDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverChapterIndex(index)
  }

  const handleChapterDragLeave = () => {
    setDragOverChapterIndex(null)
  }

  const handleChapterDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (!draggedChapter) return

    const draggedIndex = chapters.findIndex((chapter) => chapter.id === draggedChapter)
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedChapter(null)
      setDragOverChapterIndex(null)
      return
    }

    const newChapters = [...chapters]
    const [draggedItem] = newChapters.splice(draggedIndex, 1)
    newChapters.splice(dropIndex, 0, draggedItem)

    setChapters(newChapters)
    localStorage.setItem(`subject_chapters_${subject.id}`, JSON.stringify(newChapters))
    
    // Sync with main subjects list
    syncChapterData(newChapters)
    
    setDraggedChapter(null)
    setDragOverChapterIndex(null)
  }

  const handleChapterDragEnd = () => {
    setDraggedChapter(null)
    setDragOverChapterIndex(null)
  }

  const addMaterial = () => {
    if (newMaterialName.trim()) {
      const newMaterial: Material = {
        id: `material_${Date.now()}`,
        name: newMaterialName.trim(),
        type: "other",
        files: [],
        links: [], // Initialize with empty links array
        createdAt: new Date().toISOString(),
      }
      const updatedMaterials = [...materials, newMaterial]
      setMaterials(updatedMaterials)
      localStorage.setItem(`subject_materials_${subject.id}`, JSON.stringify(updatedMaterials))
      setNewMaterialName("")
    }
  }

  const updateMaterialName = (materialId: string, newName: string) => {
    const updatedMaterials = materials.map((material) =>
      material.id === materialId ? { ...material, name: newName } : material,
    )
    setMaterials(updatedMaterials)
    localStorage.setItem(`subject_materials_${subject.id}`, JSON.stringify(updatedMaterials))
    setEditingMaterial(null)
  }

  const deleteMaterial = (materialId: string) => {
    const updatedMaterials = materials.filter((material) => material.id !== materialId)
    setMaterials(updatedMaterials)
    localStorage.setItem(`subject_materials_${subject.id}`, JSON.stringify(updatedMaterials))
  }

  const handleMaterialDragStart = (e: React.DragEvent, materialId: string) => {
    setDraggedMaterial(materialId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleMaterialDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverMaterialIndex(index)
  }

  const handleMaterialDragLeave = () => {
    setDragOverMaterialIndex(null)
  }

  const handleMaterialDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (!draggedMaterial) return

    const draggedIndex = materials.findIndex((material) => material.id === draggedMaterial)
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedMaterial(null)
      setDragOverMaterialIndex(null)
      return
    }

    const newMaterials = [...materials]
    const [draggedItem] = newMaterials.splice(draggedIndex, 1)
    newMaterials.splice(dropIndex, 0, draggedItem)

    setMaterials(newMaterials)
    localStorage.setItem(`subject_materials_${subject.id}`, JSON.stringify(newMaterials))
    setDraggedMaterial(null)
    setDragOverMaterialIndex(null)
  }

  const handleMaterialDragEnd = () => {
    setDraggedMaterial(null)
    setDragOverMaterialIndex(null)
  }

  const handleFileUpload = (materialId: string, file: File) => {
    const fileUrl = URL.createObjectURL(file)
    const uploadedFile: UploadedFile = {
      id: `file_${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: fileUrl,
      uploadedAt: new Date().toISOString(),
    }

    const updatedMaterials = materials.map((material) =>
      material.id === materialId ? { ...material, files: [...material.files, uploadedFile] } : material,
    )
    setMaterials(updatedMaterials)
    localStorage.setItem(`subject_materials_${subject.id}`, JSON.stringify(updatedMaterials))
  }

  const removeFileFromMaterial = (materialId: string, fileId: string) => {
    const updatedMaterials = materials.map((material) =>
      material.id === materialId
        ? { ...material, files: material.files.filter((file) => file.id !== fileId) }
        : material,
    )
    setMaterials(updatedMaterials)
    localStorage.setItem(`subject_materials_${subject.id}`, JSON.stringify(updatedMaterials))
  }

  const downloadFile = (file: UploadedFile) => {
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (fileType.includes("pdf")) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const addLinkToMaterial = (materialId: string) => {
    if (newLinkUrl.trim() && newLinkDescription.trim()) {
      const newLink: MaterialLink = {
        id: `link_${Date.now()}`,
        url: newLinkUrl.trim(),
        description: newLinkDescription.trim(),
        createdAt: new Date().toISOString(),
      }

      const updatedMaterials = materials.map((material) =>
        material.id === materialId ? { ...material, links: [...material.links, newLink] } : material,
      )
      setMaterials(updatedMaterials)
      localStorage.setItem(`subject_materials_${subject.id}`, JSON.stringify(updatedMaterials))
      setNewLinkUrl("")
      setNewLinkDescription("")
      setAddingLinkToMaterial(null)
    }
  }

  const removeLinkFromMaterial = (materialId: string, linkId: string) => {
    const updatedMaterials = materials.map((material) =>
      material.id === materialId
        ? { ...material, links: material.links.filter((link) => link.id !== linkId) }
        : material,
    )
    setMaterials(updatedMaterials)
    localStorage.setItem(`subject_materials_${subject.id}`, JSON.stringify(updatedMaterials))
  }

  const openLink = (url: string) => {
    window.open(url.startsWith("http") ? url : `https://${url}`, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className={`h-4 w-4 rounded-full ${subject.color}`} />
            <DialogTitle className="text-xl">{subject.name}</DialogTitle>
          </div>
          <DialogDescription>{subject.description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
            <TabsTrigger value="materials">Materials & Files</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="space-y-4">
              <h3 className="flex items-center space-x-2 text-lg font-semibold">
                <Target className="h-5 w-5 text-primary" />
                <span>Progress Overview</span>
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Overall Progress</span>
                  <span className="text-sm font-medium">{progressPercentage}%</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Completed:</span>
                    <span className="font-medium">{completedChaptersCount} chapters</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Remaining:</span>
                    <span className="font-medium">{chapters.length - completedChaptersCount} chapters</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="flex items-center space-x-2 text-lg font-semibold">
                <Calendar className="h-5 w-5 text-primary" />
                <span>Subject Information</span>
              </h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p className="font-medium">{createdDate}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Chapters:</span>
                  <p className="font-medium">{chapters.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium mb-3">Quick Stats</h4>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{progressPercentage}%</div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">{materials.length}</div>
                  <div className="text-xs text-muted-foreground">Materials</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-chart-2">{chapters.length}</div>
                  <div className="text-xs text-muted-foreground">Chapters</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-chart-3">
                    {materials.reduce((total, material) => total + material.files.length + material.links.length, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Files & Links</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="chapters" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center space-x-2 text-lg font-semibold">
                  <BookMarked className="h-5 w-5 text-primary" />
                  <span>Chapters</span>
                </h3>
                <div className="text-sm text-muted-foreground">
                  {completedChaptersCount} of {chapters.length} completed
                </div>
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="Add new chapter (e.g., Introduction, Chapter 1, etc.)"
                  value={newChapterName}
                  onChange={(e) => setNewChapterName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addChapter()}
                />
                <Button onClick={addChapter} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {chapters.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              )}

              {chapters.length > 0 ? (
                <div className="space-y-2">
                  {chapters.map((chapter, index) => (
                    <div
                      key={chapter.id}
                      className={`border rounded-lg p-3 transition-all ${
                        draggedChapter === chapter.id ? "opacity-50 scale-95" : ""
                      } ${dragOverChapterIndex === index ? "ring-2 ring-primary ring-offset-2" : ""} ${
                        chapter.completed ? "bg-muted/30" : ""
                      }`}
                      draggable
                      onDragStart={(e) => handleChapterDragStart(e, chapter.id)}
                      onDragOver={(e) => handleChapterDragOver(e, index)}
                      onDragLeave={handleChapterDragLeave}
                      onDrop={(e) => handleChapterDrop(e, index)}
                      onDragEnd={handleChapterDragEnd}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-1 -ml-1 rounded hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Checkbox
                            checked={chapter.completed}
                            onCheckedChange={() => toggleChapterCompletion(chapter.id)}
                            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 data-[state=checked]:text-white border-2 border-gray-400 dark:border-gray-600 w-5 h-5"
                          />
                          {editingChapter === chapter.id ? (
                            <Input
                              value={editingChapterName}
                              onChange={(e) => setEditingChapterName(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") updateChapterName(chapter.id, editingChapterName)
                                if (e.key === "Escape") setEditingChapter(null)
                              }}
                              onBlur={() => updateChapterName(chapter.id, editingChapterName)}
                              className="h-6 text-sm"
                              autoFocus
                            />
                          ) : (
                            <span
                              className={`font-medium ${chapter.completed ? "line-through text-muted-foreground" : ""}`}
                            >
                              {chapter.name}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingChapter(chapter.id)
                              setEditingChapterName(chapter.name)
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteChapter(chapter.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookMarked className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No chapters added yet.</p>
                  <p className="text-sm">Add chapters to track your progress through this subject.</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="materials" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center space-x-2 text-lg font-semibold">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span>Study Materials & Files</span>
                </h3>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search materials and files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="Add new material (e.g., Textbook, Notes, Video)"
                  value={newMaterialName}
                  onChange={(e) => setNewMaterialName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addMaterial()}
                />
                <Button onClick={addMaterial} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {filteredMaterials.length > 0 ? (
                <div className="space-y-3">
                  {filteredMaterials.map((material, index) => (
                    <div
                      key={material.id}
                      className={`border rounded-lg p-4 space-y-3 transition-all ${
                        draggedMaterial === material.id ? "opacity-50 scale-95" : ""
                      } ${dragOverMaterialIndex === index ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      draggable
                      onDragStart={(e) => handleMaterialDragStart(e, material.id)}
                      onDragOver={(e) => handleMaterialDragOver(e, index)}
                      onDragLeave={handleMaterialDragLeave}
                      onDrop={(e) => handleMaterialDrop(e, index)}
                      onDragEnd={handleMaterialDragEnd}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="group/drag p-1 -ml-1 rounded hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4 text-muted-foreground transition-opacity" />
                          </div>
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          {editingMaterial === material.id ? (
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === "Enter") updateMaterialName(material.id, editingName)
                                if (e.key === "Escape") setEditingMaterial(null)
                              }}
                              onBlur={() => updateMaterialName(material.id, editingName)}
                              className="h-6 text-sm"
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium">{material.name}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingMaterial(material.id)
                              setEditingName(material.name)
                            }}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteMaterial(material.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {material.files.length > 0 ? (
                        <div className="space-y-2">
                          {material.files.map((file) => (
                            <div key={file.id} className="bg-muted/50 rounded-md p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  {getFileIcon(file.type)}
                                  <div>
                                    <p className="text-sm font-medium">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button variant="ghost" size="sm" onClick={() => setPreviewFile(file)}>
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => downloadFile(file)}>
                                    <Download className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFileFromMaterial(material.id, file.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {material.links.length > 0 && (
                        <div className="space-y-2">
                          {material.links.map((link) => (
                            <div key={link.id} className="bg-blue-50 dark:bg-blue-950/20 rounded-md p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                                  <div>
                                    <p className="text-sm font-medium">{link.description}</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400 truncate max-w-[200px]">
                                      {link.url}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button variant="ghost" size="sm" onClick={() => openLink(link.url)}>
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeLinkFromMaterial(material.id, link.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="border-2 border-dashed border-muted-foreground/25 rounded-md p-4">
                          <div className="text-center">
                            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground mb-2">
                              {material.files.length > 0
                                ? "Add another file"
                                : "Upload a file for this material (optional)"}
                            </p>
                            <input
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload(material.id, file)
                              }}
                              className="hidden"
                              id={`file-${material.id}`}
                              multiple
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => document.getElementById(`file-${material.id}`)?.click()}
                            >
                              Choose File
                            </Button>
                          </div>
                        </div>

                        {addingLinkToMaterial === material.id ? (
                          <div className="border rounded-md p-4 space-y-3">
                            <div className="space-y-2">
                              <Input
                                placeholder="Enter URL (e.g., https://example.com)"
                                value={newLinkUrl}
                                onChange={(e) => setNewLinkUrl(e.target.value)}
                              />
                              <Input
                                placeholder="Enter description (e.g., Course website, Tutorial video)"
                                value={newLinkDescription}
                                onChange={(e) => setNewLinkDescription(e.target.value)}
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                onClick={() => addLinkToMaterial(material.id)}
                                disabled={!newLinkUrl.trim() || !newLinkDescription.trim()}
                              >
                                Add Link
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAddingLinkToMaterial(null)
                                  setNewLinkUrl("")
                                  setNewLinkDescription("")
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAddingLinkToMaterial(material.id)}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Link
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  {searchQuery ? (
                    <>
                      <p>No materials found matching "{searchQuery}"</p>
                      <p className="text-sm">Try a different search term.</p>
                    </>
                  ) : (
                    <>
                      <p>No study materials added yet.</p>
                      <p className="text-sm">Add materials like textbooks, notes, or videos above.</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {previewFile && (
          <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{previewFile.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {previewFile.type.startsWith("image/") ? (
                  <img
                    src={previewFile.url || "/placeholder.svg"}
                    alt={previewFile.name}
                    className="w-full rounded-md"
                  />
                ) : previewFile.type.includes("pdf") ? (
                  <iframe src={previewFile.url} className="w-full h-96 rounded-md" />
                ) : (
                  <div className="text-center py-8">
                    <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p>Preview not available for this file type.</p>
                    <Button onClick={() => downloadFile(previewFile)} className="mt-4">
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
