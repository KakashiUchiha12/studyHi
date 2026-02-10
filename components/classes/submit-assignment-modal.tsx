"use client"

import { useState, useRef } from "react"
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
import {
  X,
  Upload,
  FileText,
  Loader2,
  FileIcon,
  Video,
  ImageIcon,
  Plus
} from "lucide-react"
import { toast } from "sonner"
import { Progress } from "@/components/ui/progress"
import { FilePreview } from "@/components/file-preview"
import { cn } from "@/lib/utils"

interface SubmitAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (files: { url: string; name: string; size: number; type: string }[]) => Promise<void>
  assignmentTitle: string
  maxFileSize: number
}

interface UploadingFile {
  name: string
  progress: number
}

export function SubmitAssignmentModal({
  open,
  onOpenChange,
  onSubmit,
  assignmentTitle,
  maxFileSize,
}: SubmitAssignmentModalProps) {
  const [files, setFiles] = useState<{ url: string; name: string; size: number; type: string }[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const [externalUrl, setExternalUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const fileList = Array.from(selectedFiles)
    for (const file of fileList) {
      if (file.size > maxFileSize) {
        toast.error(`${file.name} is too large. Max size is ${Math.round(maxFileSize / (1024 * 1024))}MB`)
        continue
      }

      setUploadingFiles(prev => [...prev, { name: file.name, progress: 0 }])

      // Initial progress simulation
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => prev.map(f =>
          f.name === file.name ? { ...f, progress: Math.min(f.progress + 5, 90) } : f
        ))
      }, 100)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("subfolder", "submissions")

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Upload failed")

        const data = await response.json()

        clearInterval(progressInterval)
        setUploadingFiles(prev => prev.filter(f => f.name !== file.name))

        let type = "file"
        if (file.type.startsWith("image/")) type = "image"
        else if (file.type.startsWith("video/")) type = "video"
        else if (file.type === "application/pdf") type = "pdf"

        setFiles(prev => [...prev, {
          url: data.url,
          name: file.name,
          size: file.size,
          type: type
        }])

        toast.success(`${file.name} uploaded`)
      } catch (error) {
        console.error("Upload error:", error)
        clearInterval(progressInterval)
        setUploadingFiles(prev => prev.filter(f => f.name !== file.name))
        toast.error(`Failed to upload ${file.name}`)
      }
    }
  }

  const handleAddExternalUrl = () => {
    if (!externalUrl.trim()) return

    const name = externalUrl.split('/').pop() || 'External File'
    setFiles(prev => [...prev, {
      url: externalUrl.trim(),
      name,
      size: 0,
      type: "link"
    }])
    setExternalUrl("")
    toast.success("External link added")
  }

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (files.length === 0) {
      toast.error("Please add at least one file or link")
      return
    }

    setLoading(true)
    try {
      await onSubmit(files)
      handleClose()
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = (file: any) => {
    let type = 'application/octet-stream'
    if (file.type === 'pdf') type = 'application/pdf'
    else if (file.type === 'image') type = 'image/jpeg'

    setSelectedFile({
      id: file.url,
      name: file.name,
      url: file.url,
      size: file.size,
      type: type
    })
    setIsPreviewOpen(true)
  }

  const handleClose = () => {
    setFiles([])
    setUploadingFiles([])
    setExternalUrl("")
    onOpenChange(false)
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
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none sm:border shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold">Submit Assignment</DialogTitle>
          <DialogDescription className="text-primary font-medium">
            {assignmentTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-2 space-y-6 overflow-y-auto max-h-[70vh]">
          {/* Custom Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files) }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
              isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <input
              type="file"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <div className="bg-primary/10 rounded-full p-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium">Add files to your submission</p>
            <p className="text-xs text-muted-foreground">PDFs, images, or documents up to {Math.round(maxFileSize / (1024 * 1024))}MB</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px bg-muted-foreground/10 flex-1" />
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">or add link</span>
              <div className="h-px bg-muted-foreground/10 flex-1" />
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Paste a link to your work (e.g., Google Drive)"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                className="h-10 bg-muted/20 border-muted-foreground/10"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddExternalUrl}
                disabled={!externalUrl.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Uploading Status */}
          {uploadingFiles.length > 0 && (
            <div className="space-y-3">
              {uploadingFiles.map((file, i) => (
                <div key={i} className="bg-muted p-3 rounded-lg border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium truncate italic">{file.name}</span>
                    <span className="text-[10px] font-bold text-primary">{file.progress}%</span>
                  </div>
                  <Progress value={file.progress} className="h-1" />
                </div>
              ))}
            </div>
          )}

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Your Submission ({files.length})</Label>
              <div className="grid grid-cols-1 gap-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    onClick={() => handlePreview(file)}
                    className="flex items-center gap-3 p-2 bg-background border rounded-lg group cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-9 w-9 bg-muted rounded flex items-center justify-center shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{file.type}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFile(index)
                      }}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        <DialogFooter className="p-6 border-t bg-muted/5">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || (files.length === 0 && uploadingFiles.length === 0)}
            className="px-8 shadow-lg shadow-primary/20"
            onClick={handleSubmit}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Submitting...</span>
              </div>
            ) : "Submit Assignment"}
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
