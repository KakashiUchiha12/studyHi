import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

/**
 * Loading skeleton for file list
 */
export function FileListSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-8 w-8 rounded" />
                </div>
            ))}
        </div>
    )
}

/**
 * Loading skeleton for folder grid
 */
export function FolderGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i} className="p-4 space-y-3">
                    <Skeleton className="h-12 w-12 rounded" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                </Card>
            ))}
        </div>
    )
}

/**
 * Loading skeleton for storage indicator
 */
export function StorageSkeleton() {
    return (
        <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-32" />
        </Card>
    )
}

/**
 * Loading state for file upload
 */
export function UploadingSkeleton() {
    return (
        <div className="fixed bottom-4 right-4 w-80 bg-background border rounded-lg shadow-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
        </div>
    )
}

/**
 * Loading skeleton for breadcrumbs
 */
export function BreadcrumbSkeleton() {
    return (
        <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <span className="text-muted-foreground">/</span>
            <Skeleton className="h-4 w-24" />
            <span className="text-muted-foreground">/</span>
            <Skeleton className="h-4 w-20" />
        </div>
    )
}
