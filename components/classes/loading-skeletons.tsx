import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function AssignmentCardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-6 w-3/4" />
                        <div className="flex gap-2">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-20" />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                </div>
            </CardContent>
        </Card>
    )
}

export function PostCardSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
            </CardContent>
        </Card>
    )
}

export function ClassCardSkeleton() {
    return (
        <Card>
            <Skeleton className="h-48 w-full" />
            <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                </div>
            </CardContent>
        </Card>
    )
}

export function MemberRowSkeleton() {
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <Skeleton className="h-8 w-20" />
        </div>
    )
}
