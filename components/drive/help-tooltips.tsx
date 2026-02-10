import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle, Info, AlertCircle } from "lucide-react"

interface HelpTooltipProps {
    content: string
    type?: 'info' | 'help' | 'warning'
}

/**
 * Help tooltip for drive UI
 */
export function DriveHelpTooltip({ content, type = 'help' }: HelpTooltipProps) {
    const Icon = type === 'warning' ? AlertCircle : type === 'info' ? Info : HelpCircle

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
                        <Icon className="h-4 w-4" />
                    </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                    <p className="text-sm">{content}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}

/**
 * Tooltips for common drive operations
 */
export const DriveTooltips = {
    upload: "Upload files to this folder. Max size: 500MB per file. All file types supported.",
    createFolder: "Create a new folder to organize your files. You can nest folders up to 10 levels deep.",
    storage: "Your current storage usage out of total available. Delete files to free up space.",
    share: "Share this file or folder with others. They'll get view-only access by default.",
    download: "Download this file to your device. Large files may take longer.",
    delete: "Move to trash. Items in trash are automatically deleted after 30 days.",
    restore: "Restore this item from trash to its original location.",
    tags: "Add tags to make files easier to find. Press Enter after each tag.",
    search: "Search for files by name, extension, or tags. Use quotes for exact matches.",
    sort: "Change how files are sorted. Click column headers to sort by that field.",
    view: "Switch between list and grid view. Your preference is saved automatically.",
    permissions: "Only you can access your files unless you explicitly share them.",
    bandwidth: "Daily download/upload limit. Resets at midnight UTC.",
    duplicate: "A file with this content already exists. Upload anyway to keep both.",
    rateLimit: "Too many operations. Please wait before trying again.",
    subjects: "Files from your subjects appear here automatically in dedicated folders.",
}
