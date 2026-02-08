"use client"

import { useState } from "react"
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
import { X, Upload as UploadIcon, FileText } from "lucide-react"
import { toast } from "sonner"

interface SubmitAssignmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (files: { url: string; name: string; size: number }[]) => Promise<void>
  assignmentTitle: string
  maxFileSize: number
}

export function SubmitAssignmentModal({
  open,
  onOpenChange,
  onSubmit,
  assignmentTitle,
  maxFileSize,
}: SubmitAssignmentModalProps) {
  const [files, setFiles] = useState<{ url: string; name: string; size: number }[]>([])
  const [fileUrls, setFileUrls] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleAddFile = () => {
    const urls = fileUrls.split('\n').filter(url => url.trim())
    
    if (urls.length === 0) {
      toast.error("Please enter at least one file URL")
      return
    }

    const newFiles = urls.map(url => ({
      url: url.trim(),
      name: url.trim().split('/').pop() || 'file',
      size: 0,
    }))

    setFiles([...files, ...newFiles])
    setFileUrls("")
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (files.length === 0) {
      toast.error("Please add at least one file")
      return
    }

    setLoading(true)
    try {
      await onSubmit(files)
      setFiles([])
      setFileUrls("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Submit Assignment</DialogTitle>
          <DialogDescription>
            {assignmentTitle}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fileUrls">File URLs</Label>
            <textarea
              id="fileUrls"
              placeholder="Enter file URLs (one per line)&#10;https://example.com/file1.pdf&#10;https://example.com/file2.docx"
              value={fileUrls}
              onChange={(e) => setFileUrls(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Enter Google Drive, Dropbox, or other file sharing URLs
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddFile}
              className="w-full"
            >
              <UploadIcon className="h-4 w-4 mr-2" />
              Add Files
            </Button>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Submitted Files ({files.length})</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded-md"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || files.length === 0}>
              {loading ? "Submitting..." : "Submit Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
