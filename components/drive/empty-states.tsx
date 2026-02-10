import { FileQuestion, FolderOpen, Upload, HardDrive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
    }
}

/**
 * Generic empty state component
 */
export function DriveEmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="text-muted-foreground mb-4">
                {icon || <FolderOpen className="h-16 w-16" />}
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
                {description}
            </p>
            {action && (
                <Button onClick={action.onClick} size="lg">
                    {action.label}
                </Button>
            )}
        </div>
    )
}

/**
 * Empty folder state
 */
export function EmptyFolderState({ onUpload }: { onUpload: () => void }) {
    return (
        <DriveEmptyState
            icon={<FolderOpen className="h-16 w-16" />}
            title="This folder is empty"
            description="Upload files or create subfolders to organize your content."
            action={{
                label: "Upload Files",
                onClick: onUpload
            }}
        />
    )
}

/**
 * Empty drive state (first time)
 */
export function EmptyDriveState({ onUpload }: { onUpload: () => void }) {
    return (
        <DriveEmptyState
            icon={<HardDrive className="h-16 w-16" />}
            title="Welcome to your Drive"
            description="Start by uploading your first file. You can organize files into folders and access them from anywhere."
            action={{
                label: "Upload Your First File",
                onClick: onUpload
            }}
        />
    )
}

/**
 * No search results state
 */
export function NoSearchResults({ query }: { query: string }) {
    return (
        <DriveEmptyState
            icon={<FileQuestion className="h-16 w-16" />}
            title="No files found"
            description={`No files match "${query}". Try a different search term or check your filters.`}
        />
    )
}

/**
 * Storage full state
 */
export function StorageFullState({ onManage }: { onManage: () => void }) {
    return (
        <Card className="p-6 border-destructive">
            <DriveEmptyState
                icon={<HardDrive className="h-16 w-16 text-destructive" />}
                title="Storage limit reached"
                description="You've used all your available storage. Delete some files or upgrade your plan to upload more."
                action={{
                    label: "Manage Storage",
                    onClick: onManage
                }}
            />
        </Card>
    )
}

/**
 * Upload prompt overlay
 */
export function UploadPrompt({ onUpload }: { onUpload: () => void }) {
    return (
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onClick={onUpload}>
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-medium mb-2">Drop files here or click to upload</h4>
            <p className="text-sm text-muted-foreground">
                Supports all file types up to 500MB
            </p>
        </div>
    )
}
