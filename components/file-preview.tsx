"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  FileText,
  Download,
  Eye,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Loader2,
  Maximize2,
  Minimize2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Import React-PDF
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// ... (FilePreviewProps interface remains same)
interface FilePreviewProps {
  file: {
    id: string
    name: string
    type: string
    size: number
    url: string
    thumbnail?: string
    uploadedAt?: Date
    category?: string
    description?: string
    isPublic?: boolean
    content?: string
  }
  isOpen: boolean
  onClose: () => void
  showDownload?: boolean
  showDelete?: boolean
  onDelete?: (fileId: string) => void
}

export function FilePreview({
  file,
  isOpen,
  onClose,
  showDownload = true,
  showDelete = false,
  onDelete
}: FilePreviewProps) {
  // ... (existing state and useEffects remain same)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const [textContent, setTextContent] = useState<string>('')
  const [isLoadingText, setIsLoadingText] = useState(false)

  // Load text file content when component mounts
  useEffect(() => {
    if (file.type.startsWith('text/') && file.url && !file.content) {
      setIsLoadingText(true)
      fetch(file.url)
        .then(response => response.text())
        .then(content => {
          setTextContent(content)
          setIsLoadingText(false)
        })
        .catch(error => {
          console.error('Error loading text file:', error)
          setTextContent('Error loading file content')
          setIsLoadingText(false)
        })
    } else if (file.content) {
      setTextContent(file.content)
    }
  }, [file.url, file.type, file.content])


  // ... (helper functions getFileIcon, formatFileSize, formatFileType remain same)
  const getFileIcon = (fileType: string) => {
    if (!fileType) return '📁'
    if (fileType.startsWith('image/')) return '🖼️'
    if (fileType === 'application/pdf') return '📄'
    if (fileType.startsWith('text/')) return '📝'
    if (fileType.includes('word') || fileType.includes('document')) return '📄'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊'
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📊'
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦'
    if (fileType.startsWith('audio/')) return '🎵'
    if (fileType.startsWith('video/')) return '🎬'
    return '📁'
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatFileType = (fileType: string) => {
    if (!fileType) return 'Unknown File'
    if (fileType.startsWith('image/')) return 'Image'
    if (fileType === 'application/pdf') return 'PDF Document'
    if (fileType.startsWith('text/')) return 'Text File'
    if (fileType.includes('word')) return 'Word Document'
    if (fileType.includes('excel')) return 'Excel Spreadsheet'
    if (fileType.includes('powerpoint')) return 'PowerPoint Presentation'
    if (fileType.includes('zip') || fileType.includes('rar')) return 'Archive'
    if (fileType.startsWith('audio/')) return 'Audio File'
    if (fileType.startsWith('video/')) return 'Video File'
    return 'File'
  }

  // ... (handleAudioPlayPause, handleVideoPlayPause, handleAudioLoad, handleVideoLoad remain same)
  const handleAudioPlayPause = () => {
    if (audio) {
      if (isPlaying) {
        audio.pause()
      } else {
        audio.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleVideoPlayPause = () => {
    if (video) {
      if (isPlaying) {
        video.pause()
      } else {
        video.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleAudioLoad = (element: HTMLAudioElement) => {
    setAudio(element)
    element.addEventListener('ended', () => setIsPlaying(false))
  }

  const handleVideoLoad = (element: HTMLVideoElement) => {
    setVideo(element)
    element.addEventListener('ended', () => setIsPlaying(false))
  }

  // ... (handleDownload, handleDelete remain same)
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)

  const handleDownload = async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/drive/save-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: file.url,
          name: file.name
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save to Drive')
      }

      toast({
        title: 'Saved to Drive',
        description: 'File has been saved to your personal Drive.',
      })
    } catch (e) {
      console.error("Save to Drive failed", e)
      toast({
        title: 'Error',
        description: 'Failed to save file to Drive.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(file.id)
      onClose()
    }
  }

  const renderPreview = () => {
    // ... (image preview remains same)
    if (file.type.startsWith('image/')) {
      return (
        <div className="w-full h-[60vh] flex flex-col">
          {/* Image Preview Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Image Preview</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                Save to Drive
              </Button>
            </div>
          </div>

          {/* Image Content */}
          <div className="flex-1 flex items-center justify-center bg-muted/20 p-4">
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-full object-contain rounded shadow-lg"
              onError={(e) => {
                e.currentTarget.src = '/placeholder-image.png'
                e.currentTarget.alt = 'Image preview not available'
              }}
            />
          </div>
        </div>
      )
    }

    if (file.type === 'application/pdf') {
      return (
        <div className="w-full h-[80vh] border rounded-lg overflow-hidden bg-muted/20 flex flex-col">
          {/* PDF Preview Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between shrink-0">
            <span className="text-sm font-medium">PDF Preview</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                Save to Drive
              </Button>
            </div>
          </div>

          {/* PDF Content */}
          <div className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-900">
            <PDFViewer url={file.url} />
          </div>
        </div>
      )
    }

    // ... (rest of renderPreview remain same)
    if (file.type.includes('word') || file.type.includes('document') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return (
        <div className="w-full h-[60vh] flex flex-col">
          {/* Word Document Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Word Document</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                Save to Drive
              </Button>
            </div>
          </div>

          {/* Word Content */}
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8">
            <div className="text-6xl mb-6">📄</div>
            <p className="text-lg font-medium text-center mb-4 max-w-md">{file.name}</p>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
              Preview not available for Word documents. You can download the file to view it in Microsoft Word or compatible applications.
            </p>
            <Button onClick={handleDownload} size="lg" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Save to Drive
            </Button>
          </div>
        </div>
      )
    }

    if (file.type.includes('excel') || file.type.includes('spreadsheet') ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      return (
        <div className="w-full h-[60vh] flex flex-col">
          {/* Excel Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Excel Spreadsheet</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                Save to Drive
              </Button>
            </div>
          </div>

          {/* Excel Content */}
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8">
            <div className="text-6xl mb-6">📊</div>
            <p className="text-lg font-medium text-center mb-4 max-w-md">{file.name}</p>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
              Preview not available for Excel files. You can download the file to view it in Microsoft Excel or compatible applications.
            </p>
            <Button onClick={handleDownload} size="lg" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Save to Drive
            </Button>
          </div>
        </div>
      )
    }

    if (file.type.includes('powerpoint') || file.type.includes('presentation') ||
      file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      return (
        <div className="w-full h-[60vh] flex flex-col">
          {/* PowerPoint Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">PowerPoint Presentation</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                Save to Drive
              </Button>
            </div>
          </div>

          {/* PowerPoint Content */}
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8">
            <div className="text-6xl mb-6">📊</div>
            <p className="text-lg font-medium text-center mb-4 max-w-md">{file.name}</p>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
              Preview not available for PowerPoint files. You can download the file to view it in Microsoft PowerPoint or compatible applications.
            </p>
            <Button onClick={handleDownload} size="lg" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Save to Drive
            </Button>
          </div>
        </div>
      )
    }

    if (file.type.startsWith('audio/')) {
      return (
        <div className="w-full h-[60vh] flex flex-col">
          {/* Audio Preview Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Audio Preview</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                Save to Drive
              </Button>
            </div>
          </div>

          {/* Audio Content */}
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8">
            <div className="text-6xl mb-6">🎵</div>
            <p className="text-lg font-medium text-center mb-4 max-w-md">{file.name}</p>
            <audio
              ref={handleAudioLoad}
              controls
              className="w-full max-w-md"
            >
              <source src={file.url} type={file.type} />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      )
    }

    if (file.type.startsWith('video/')) {
      return (
        <div className="w-full h-[60vh] flex flex-col">
          {/* Video Preview Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Video Preview</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                Save to Drive
              </Button>
            </div>
          </div>

          {/* Video Content */}
          <div className="flex-1 flex items-center justify-center bg-muted/20 p-8">
            <video
              ref={handleVideoLoad}
              controls
              className="w-full max-w-2xl h-full object-contain rounded shadow-lg"
              poster={file.thumbnail}
            >
              <source src={file.url} type={file.type} />
              Your browser does not support the video element.
            </video>
          </div>
        </div>
      )
    }

    if (file.type.startsWith('text/')) {
      return (
        <div className="w-full h-[60vh] flex flex-col">
          {/* Text Preview Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Text File Preview</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                Save to Drive
              </Button>
            </div>
          </div>

          {/* Text Content */}
          <div className="flex-1 bg-muted/20 p-4">
            <div className="bg-background rounded-lg border h-full overflow-auto">
              {isLoadingText ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading text content...</p>
                  </div>
                </div>
              ) : (
                <pre className="text-sm font-mono whitespace-pre-wrap break-words p-4 h-full overflow-auto">
                  {textContent || 'Text content not available'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )
    }

    if (file.type.includes('zip') || file.type.includes('rar') || file.type.includes('7z')) {
      return (
        <div className="w-full h-[60vh] flex flex-col">
          {/* Archive Header */}
          <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
            <span className="text-sm font-medium">Archive File</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(file.url, '_blank')}
              >
                <Eye className="h-3 w-3 mr-1" />
                Open in New Tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                Save to Drive
              </Button>
            </div>
          </div>

          {/* Archive Content */}
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8">
            <div className="text-6xl mb-6">📦</div>
            <p className="text-lg font-medium text-center mb-4 max-w-md">{file.name}</p>
            <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
              Preview not available for archive files. You can download the file and extract it using applications like WinRAR, 7-Zip, or built-in archive tools.
            </p>
            <Button onClick={handleDownload} size="lg" disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Save to Drive
            </Button>
          </div>
        </div>
      )
    }

    // Default for other file types
    return (
      <div className="w-full h-[60vh] flex flex-col">
        {/* Default File Header */}
        <div className="bg-muted/50 p-2 border-b flex items-center justify-between">
          <span className="text-sm font-medium">File Preview</span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(file.url, '_blank')}
            >
              <Eye className="h-3 w-3 mr-1" />
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Download className="h-3 w-3 mr-1" />
              )}
              Save to Drive
            </Button>
          </div>
        </div>

        {/* Default File Content */}
        <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8">
          <div className="text-6xl mb-6">{getFileIcon(file.type)}</div>
          <p className="text-lg font-medium text-center mb-4 max-w-md">{file.name}</p>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
            Preview not available for this file type. You can download the file to view it in an appropriate application.
          </p>
          <Button onClick={handleDownload} size="lg" disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Save to Drive
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isFullScreen ? 'w-screen h-screen max-w-none rounded-none border-0 m-0 p-0' : 'sm:max-w-[90vw] md:max-w-[1200px] h-[90vh]'} flex flex-col p-0 gap-0 overflow-hidden transition-all duration-200`}>
        <DialogHeader className="p-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <span className="text-lg">{getFileIcon(file.type)}</span>
              <span className="truncate max-w-md">{file.name || 'Unnamed File'}</span>
            </DialogTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => setIsFullScreen(!isFullScreen)} title={isFullScreen ? "Exit Full Screen" : "Full Screen"}>
                {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* File Info Bar - Collapsible or small */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-muted/30 p-2 border-b shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">Type:</span>
              <span className="text-muted-foreground truncate">{formatFileType(file.type)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Size:</span>
              <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
            </div>
            {/* ... other info ... */}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-auto bg-background p-4 flex justify-center">
            {renderPreview()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Lazy load wrapper for PDF Page
function LazyPDFPage({
  pageNumber,
  scale,
  rotate,
  onInView
}: {
  pageNumber: number,
  scale: number,
  rotate: number,
  onInView?: (page: number) => void
}) {
  const [inView, setInView] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            onInView?.(pageNumber);
          } else {
            // Unload page when out of view to save memory
            // Keep a buffer? For now, aggressive unloading to fix crash
            setInView(false);
          }
        });
      },
      {
        root: null, // viewport
        rootMargin: '200px', // Preload 200px before
        threshold: 0.1
      }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [pageNumber, onInView]);

  return (
    <div
      ref={elementRef}
      className="flex justify-center relative min-h-[500px]" // Min height to prevent collapse
      style={{
        // Approximate height to prevent scroll jumping if possible, 
        // but explicit height is hard without loading page first.
        // We'll rely on the min-height and the observer.
      }}
    >
      {inView ? (
        <Page
          pageNumber={pageNumber}
          scale={scale}
          rotate={rotate}
          renderTextLayer={true}
          renderAnnotationLayer={true}
          className="bg-white shadow-md"
          loading={
            <div
              className="bg-white animate-pulse"
              style={{
                width: `calc(595px * ${scale})`,
                height: `calc(842px * ${scale})`
              }}
            />
          }
        />
      ) : (
        <div
          className="bg-muted/10 flex items-center justify-center text-muted-foreground/20"
          style={{
            width: `calc(595px * ${scale})`,
            height: `calc(842px * ${scale})` // Estimate A4 height
          }}
        >
          Page {pageNumber}
        </div>
      )}
    </div>
  );
}

// Improved PDF Viewer Component using react-pdf
function PDFViewer({ url }: { url: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('1');

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
      setInputValue(newPage.toString());
      // Scroll to page logic could be added here if using a list ref
      const pageElement = document.getElementById(`pdf-page-${newPage}`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const page = parseInt(inputValue);
      if (!isNaN(page)) {
        handlePageChange(page);
      }
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 border-b p-2 flex items-center justify-center gap-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-2 bg-muted/50 rounded-md p-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale(s => Math.max(0.5, s - 0.1))} title="Zoom Out">
            <span className="text-lg">-</span>
          </Button>
          <span className="text-xs font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setScale(s => Math.min(2.5, s + 0.1))} title="Zoom In">
            <span className="text-lg">+</span>
          </Button>
        </div>

        <div className="h-6 w-[1px] bg-border mx-2" />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => handlePageChange(pageNumber - 1)} disabled={pageNumber <= 1}>
            Previous
          </Button>
          <div className="flex items-center gap-1">
            <Input
              className="h-8 w-16 text-center"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleInputKeyDown}
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">of {numPages}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => handlePageChange(pageNumber + 1)} disabled={pageNumber >= numPages}>
            Next
          </Button>
        </div>

        {/* Simple Rotate */}
        <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={() => setRotation(r => (r + 90) % 360)} title="Rotate">
          <span className="text-xl">⟳</span>
        </Button>
      </div>

      {/* Scrollable Document Area */}
      <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-8 flex justify-center">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          }
          error={
            <div className="flex items-center justify-center h-full text-destructive">
              <p>Failed to load PDF.</p>
            </div>
          }
          className="shadow-2xl"
        >
          {/* Render all pages for scrolling */}
          {Array.from(new Array(numPages), (el, index) => (
            <div key={`page_${index + 1}`} id={`pdf-page-${index + 1}`} className="mb-4 last:mb-0">
              <LazyPDFPage
                pageNumber={index + 1}
                scale={scale}
                rotate={rotation}
                onInView={(page) => {
                  // Optional: Update current page number as we scroll
                  // Debouncing would be good here to avoid rapid state updates
                  if (page !== pageNumber) {
                    setPageNumber(page);
                    setInputValue(page.toString());
                  }
                }}
              />
            </div>
          ))}
        </Document>
      </div>
    </div>
  );
}
