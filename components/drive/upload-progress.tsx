import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, CheckCircle2, XCircle, Upload, File } from "lucide-react"

interface UploadFile {
    file: File
    progress: number
    status: 'uploading' | 'success' | 'error'
    error?: string
}

interface FileUploadProgressProps {
    files: UploadFile[]
    onCancel: (index: number) => void
    onClose: () => void
}

/**
 * File upload progress indicator
 */
export function FileUploadProgress({ files, onCancel, onClose }: FileUploadProgressProps) {
    const [minimized, setMinimized] = useState(false)

    const allComplete = files.every(f => f.status !== 'uploading')
    const successCount = files.filter(f => f.status === 'success').length
    const errorCount = files.filter(f => f.status === 'error').length

    // Auto-close after 5 seconds when all complete
    useEffect(() => {
        if (allComplete && files.length > 0) {
            const timer = setTimeout(() => {
                onClose()
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [allComplete, files.length, onClose])

    if (files.length === 0) return null

    return (
        <Card className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] shadow-lg z-50">
            <div className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        <span className="font-medium text-sm">
                            {allComplete ? 'Upload Complete' : 'Uploading files...'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMinimized(!minimized)}
                            className="h-6 w-6 p-0"
                        >
                            {minimized ? '▲' : '▼'}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="h-6 w-6 p-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Summary */}
                {!minimized && (
                    <div className="text-xs text-muted-foreground">
                        {successCount > 0 && <span className="text-green-600">{successCount} succeeded</span>}
                        {errorCount > 0 && <span className="text-destructive ml-2">{errorCount} failed</span>}
                        {!allComplete && <span className="ml-2">{files.filter(f => f.status === 'uploading').length} in progress</span>}
                    </div>
                )}

                {/* File list */}
                {!minimized && (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {files.map((uploadFile, index) => (
                            <div key={index} className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <File className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-sm truncate flex-1">
                                        {uploadFile.file.name}
                                    </span>
                                    {uploadFile.status === 'success' && (
                                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    )}
                                    {uploadFile.status === 'error' && (
                                        <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                                    )}
                                    {uploadFile.status === 'uploading' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onCancel(index)}
                                            className="h-6 w-6 p-0 flex-shrink-0"
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>

                                {uploadFile.status === 'uploading' && (
                                    <div className="space-y-1">
                                        <Progress value={uploadFile.progress} className="h-1" />
                                        <span className="text-xs text-muted-foreground">
                                            {uploadFile.progress}%
                                        </span>
                                    </div>
                                )}

                                {uploadFile.status === 'error' && uploadFile.error && (
                                    <p className="text-xs text-destructive">{uploadFile.error}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Overall progress for minimized state */}
                {minimized && !allComplete && (
                    <div className="space-y-1">
                        <Progress
                            value={(successCount / files.length) * 100}
                            className="h-1"
                        />
                        <span className="text-xs text-muted-foreground">
                            {successCount} of {files.length} files
                        </span>
                    </div>
                )}
            </div>
        </Card>
    )
}

/**
 * Simple loading indicator for inline use
 */
export function InlineLoadingIndicator({ message = "Loading..." }: { message?: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            <span>{message}</span>
        </div>
    )
}
