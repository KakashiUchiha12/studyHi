"use client"

import { useEffect, useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  CalendarIcon,
  FileText,
  X,
  Upload,
  Loader2,
  FileIcon,
  Video,
  ImageIcon
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { FilePreview } from "@/components/file-preview"
import { cn } from "@/lib/utils"

interface CreateAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (assignmentData: {
    title: string
    description: string
    dueDate: string
    allowLateSubmission: boolean
    attachments?: any[]
  }) => Promise<void>
  initialData?: any
  mode?: "create" | "edit"
}

interface UploadingFile {
  name: string
  progress: number
}

export function CreateAssignmentModal({
  open,
  onOpenChange,
  onSave,
  initialData,
  mode = "create"
}: CreateAssignmentModalProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState<Date>()
  const [dueTime, setDueTime] = useState("23:59")
  const [allowLateSubmission, setAllowLateSubmission] = useState(false)
  const [attachments, setAttachments] = useState<any[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize data if in edit mode
  useEffect(() => {
    if (mode === "edit" && initialData && open) {
      setTitle(initialData.title || "")
      setDescription(initialData.description || "")

      if (initialData.dueDate) {
        const date = new Date(initialData.dueDate)
        setDueDate(date)
        setDueTime(format(date, "HH:mm"))
      }

      setAllowLateSubmission(initialData.allowLateSubmission ?? false)

      // Handle attachments
      if (initialData.attachments) {
        const atts = typeof initialData.attachments === 'string'
          ? JSON.parse(initialData.attachments)
          : initialData.attachments
        setAttachments(atts)
      } else {
        setAttachments([])
      }
    } else if (mode === "create" && open) {
      // Clear state for new assignment
      setTitle("")
      setDescription("")
      setDueDate(undefined)
      setDueTime("23:59")
      setAllowLateSubmission(false)
      setAttachments([])
    }
  }, [mode, initialData, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim() || !dueDate) {
      return
    }

    const [hours, minutes] = dueTime.split(':')
    const dueDateWithTime = new Date(dueDate)
    dueDateWithTime.setHours(parseInt(hours), parseInt(minutes))

    setLoading(true)
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDateWithTime.toISOString(),
        allowLateSubmission,
        attachments,
      })

      handleClose()
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (mode === "create") {
      setTitle("")
      setDescription("")
      setDueDate(undefined)
      setDueTime("23:59")
      setAllowLateSubmission(false)
      setAttachments([])
    }
    setUploadingFiles([])
    onOpenChange(false)
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return

    const fileList = Array.from(files)
    for (const file of fileList) {
      setUploadingFiles(prev => [...prev, { name: file.name, progress: 0 }])

      // Initial progress
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => prev.map(f =>
          f.name === file.name ? { ...f, progress: Math.min(f.progress + 5, 90) } : f
        ))
      }, 100)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("subfolder", "assignments")

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Upload failed")

        const data = await response.json()

        clearInterval(progressInterval)
        setUploadingFiles(prev => prev.filter(f => f.name !== file.name))

        // Determine file type icon/label
        let type = "file"
        if (file.type.startsWith("image/")) type = "image"
        else if (file.type.startsWith("video/")) type = "video"
        else if (file.type === "application/pdf") type = "pdf"

        setAttachments(prev => [...prev, {
          url: data.url,
          name: file.name,
          size: file.size,
          type: type
        }])

        toast.success(`${file.name} uploaded successfully`)
      } catch (error) {
        console.error("Upload error:", error)
        clearInterval(progressInterval)
        setUploadingFiles(prev => prev.filter(f => f.name !== file.name))
        toast.error(`Failed to upload ${file.name}`)
      }
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handlePreview = (att: any) => {
    let type = 'application/octet-stream'
    if (att.type === 'pdf') type = 'application/pdf'
    else if (att.type === 'image') type = 'image/jpeg'

    setSelectedFile({
      id: att.url,
      name: att.name,
      url: att.url,
      size: att.size,
      type: type
    })
    setIsPreviewOpen(true)
  }

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => {
    setIsDragging(false)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4 text-emerald-500" />
      case 'video': return <Video className="h-4 w-4 text-purple-500" />
      case 'pdf': return <FileText className="h-4 w-4 text-rose-500" />
      default: return <FileIcon className="h-4 w-4 text-blue-500" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !loading && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[700px] max-h-[95vh] flex flex-col p-0 overflow-hidden border-none sm:border shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {mode === "edit" ? "Edit Assignment" : "Create Assignment"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {mode === "edit"
              ? "Update the details and deadline for this assignment."
              : "Design a new task for your students to complete."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-semibold">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Quantum Mechanics Problem Set 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold">Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe the assignment expectations, resources, and evaluation criteria..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                required
                className="bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Due Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-11 bg-muted/30 border-muted-foreground/20"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                      {dueDate ? format(dueDate, "PPP") : <span className="text-muted-foreground">Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Due Time *</Label>
                <div className="relative group">
                  <Input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="h-11 bg-muted/30 border-muted-foreground/20 focus-visible:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Materials (Files)</Label>

              {/* Custom Dropzone */}
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 min-h-[160px]",
                  isDragging ? "border-primary bg-primary/5 scale-[0.99]" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30",
                  attachments.length > 0 && "py-4 min-h-0"
                )}
              >
                <input
                  type="file"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
                <div className="bg-primary/10 rounded-full p-3 mb-1">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, Word, Images, or Video (Max 50MB)</p>
                </div>
              </div>

              {/* Uploading Progress */}
              {uploadingFiles.length > 0 && (
                <div className="space-y-3 mt-4">
                  {uploadingFiles.map((file, i) => (
                    <div key={i} className="bg-muted/30 p-3 rounded-lg border border-primary/10">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          <span className="text-xs font-medium truncate italic">{file.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-primary">{file.progress}%</span>
                      </div>
                      <Progress value={file.progress} className="h-1.5" />
                    </div>
                  ))}
                </div>
              )}

              {/* Attached Files List */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {attachments.map((att, index) => (
                    <div
                      key={index}
                      onClick={() => handlePreview(att)}
                      className="flex items-center gap-3 p-2 bg-background border border-muted-foreground/10 rounded-lg group animate-in fade-in slide-in-from-bottom-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-9 w-9 rounded bg-muted/50 flex items-center justify-center shrink-0">
                        {getFileIcon(att.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{att.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{att.type}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeAttachment(index)
                        }}
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-muted-foreground/10">
              <div className="space-y-0.5">
                <Label htmlFor="lateSubmission" className="text-sm font-semibold">Allow Late Submissions</Label>
                <p className="text-xs text-muted-foreground">
                  Allow students to submit deliverables after the deadline.
                </p>
              </div>
              <Switch
                id="lateSubmission"
                checked={allowLateSubmission}
                onCheckedChange={setAllowLateSubmission}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>
        </form>

        <DialogFooter className="p-6 border-t bg-muted/10 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
            className="flex-1 sm:flex-none border border-transparent hover:border-muted-foreground/20"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !title.trim() || !description.trim() || !dueDate || uploadingFiles.length > 0}
            className="flex-1 sm:flex-none px-8 relative overflow-hidden group shadow-lg shadow-primary/20"
            onClick={handleSubmit}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{mode === "edit" ? "Saving..." : "Creating..."}</span>
              </div>
            ) : (mode === "edit" ? "Save Changes" : "Create Assignment")}
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </Button>
        </DialogFooter>
      </DialogContent>
      {selectedFile && (
        <FilePreview
          file={selectedFile}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </Dialog>
  )
}
