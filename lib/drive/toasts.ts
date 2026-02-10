import { toast } from "sonner"
import { CheckCircle2, XCircle, AlertTriangle, Info, Upload, Trash2, Folder, Share2 } from "lucide-react"

/**
 * Success toasts for drive operations
 */
export const driveToasts = {
    // Upload operations
    uploadSuccess: (fileName: string) => {
        toast.success("File uploaded", {
            description: `${fileName} has been uploaded successfully`,
            icon: <CheckCircle2 className="h-4 w-4" />,
        })
    },

    uploadMultipleSuccess: (count: number) => {
        toast.success("Files uploaded", {
            description: `${count} files have been uploaded successfully`,
            icon: <Upload className="h-4 w-4" />,
        })
    },

    uploadError: (fileName: string, error: string) => {
        toast.error("Upload failed", {
            description: `Failed to upload ${fileName}: ${error}`,
            icon: <XCircle className="h-4 w-4" />,
        })
    },

    uploadSizeLimit: (limit: string) => {
        toast.error("File too large", {
            description: `File exceeds the maximum size of ${limit}`,
            icon: <AlertTriangle className="h-4 w-4" />,
        })
    },

    uploadStorageFull: () => {
        toast.error("Storage limit reached", {
            description: "Delete some files to free up space or upgrade your plan",
            icon: <AlertTriangle className="h-4 w-4" />,
        })
    },

    // Folder operations
    folderCreated: (folderName: string) => {
        toast.success("Folder created", {
            description: `"${folderName}" has been created`,
            icon: <Folder className="h-4 w-4" />,
        })
    },

    folderRenamed: (oldName: string, newName: string) => {
        toast.success("Folder renamed", {
            description: `"${oldName}" renamed to "${newName}"`,
            icon: <Folder className="h-4 w-4" />,
        })
    },

    // Delete operations
    fileDeleted: (fileName: string) => {
        toast.success("Moved to trash", {
            description: `${fileName} has been moved to trash`,
            icon: <Trash2 className="h-4 w-4" />,
      action: {
                label: "Undo",
                onClick: () => console.log("Undo delete"),
            },
        })
    },

    filesDeleted: (count: number) => {
        toast.success("Moved to trash", {
            description: `${count} items have been moved to trash`,
            icon: <Trash2 className="h-4 w-4" />,
        })
    },

    permanentlyDeleted: (fileName: string) => {
        toast.success("Permanently deleted", {
            description: `${fileName} has been permanently deleted`,
            icon: <Trash2 className="h-4 w-4" />,
        })
    },

    restored: (fileName: string) => {
        toast.success("Restored", {
            description: `${fileName} has been restored`,
            icon: <CheckCircle2 className="h-4 w-4" />,
        })
    },

    // Share operations
    shareCreated: () => {
        toast.success("Share link created", {
            description: "Link copied to clipboard",
            icon: <Share2 className="h-4 w-4" />,
        })
    },

    // Download operations
    downloadStarted: (fileName: string) => {
        toast.info("Download started", {
            description: `Downloading ${fileName}...`,
            icon: <Info className="h-4 w-4" />,
        })
    },

    // Copy/Move operations
    fileCopied: (fileName: string) => {
        toast.success("File copied", {
            description: `${fileName} has been copied`,
            icon: <CheckCircle2 className="h-4 w-4" />,
        })
    },

    fileMoved: (fileName: string, destination: string) => {
        toast.success("File moved", {
            description: `${fileName} moved to ${destination}`,
            icon: <CheckCircle2 className="h-4 w-4" />,
        })
    },

    // Rate limiting
    rateLimitExceeded: (operation: string, resetTime?: Date) => {
        const timeString = resetTime
            ? ` Try again ${resetTime.toLocaleTimeString()}`
            : " Please try again in a few moments"

        toast.error("Too many requests", {
            description: `Too many ${operation} operations.${timeString}`,
            icon: <AlertTriangle className="h-4 w-4" />,
        })
    },

    // Bandwidth limit
    bandwidthExceeded: (resetTime: Date) => {
        toast.error("Bandwidth limit exceeded", {
            description: `Daily limit reached. Resets at ${resetTime.toLocaleTimeString()}`,
            icon: <AlertTriangle className="h-4 w-4" />,
        })
    },

    // Duplicate detection
    duplicateFound: (fileName: string) => {
        toast.warning("Duplicate file detected", {
            description: `A file with this content already exists: ${fileName}`,
            icon: <Info className="h-4 w-4" />,
      action: {
                label: "Upload anyway",
                onClick: () => console.log("Upload duplicate"),
            },
        })
    },

    // Generic errors
    operationFailed: (operation: string, error?: string) => {
        toast.error(`${operation} failed`, {
            description: error || "An unexpected error occurred",
            icon: <XCircle className="h-4 w-4" />,
        })
    },

    // Info messages
    processingBulk: (count: number, operation: string) => {
        toast.info(`Processing ${operation}`, {
            description: `${operation} ${count} items...`,
            icon: <Info className="h-4 w-4" />,
        })
    },
}
