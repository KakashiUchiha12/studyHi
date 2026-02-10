import { FileQuestion, FolderOpen, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
    }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
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
                <Button onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    )
}

export function NoClassesState({ onCreate }: { onCreate: () => void }) {
    return (
        <EmptyState
            title="No classes yet"
            description="Get started by creating your first class. You can invite students and start sharing assignments and resources."
            action={{
                label: "Create Class",
                onClick: onCreate
            }}
        />
    )
}

export function NoAssignmentsState({ onCreate, userRole }: { onCreate?: () => void; userRole: string }) {
    if (userRole === 'teacher' || userRole === 'admin') {
        return (
            <EmptyState
                icon={<FileQuestion className="h-16 w-16" />}
                title="No assignments yet"
                description="Create your first assignment to give students work to complete."
                action={onCreate ? {
                    label: "Create Assignment",
                    onClick: onCreate
                } : undefined}
            />
        )
    }

    return (
        <EmptyState
            icon={<FileQuestion className="h-16 w-16" />}
            title="No assignments yet"
            description="Your teacher hasn't created any assignments yet. Check back later!"
        />
    )
}

export function NoPostsState({ onCreate, allowStudentPosts, userRole }: {
    onCreate?: () => void
    allowStudentPosts: boolean
    userRole: string
}) {
    const canPost = userRole === 'teacher' || userRole === 'admin' || allowStudentPosts

    if (canPost && onCreate) {
        return (
            <EmptyState
                title="No posts yet"
                description="Start the conversation by creating the first post in this class."
                action={{
                    label: "Create Post",
                    onClick: onCreate
                }}
            />
        )
    }

    return (
        <EmptyState
            title="No posts yet"
            description="Your teacher hasn't posted anything yet. Check back later!"
        />
    )
}

export function NoMembersState() {
    return (
        <EmptyState
            title="No members yet"
            description="Share the join code with students to let them join this class."
        />
    )
}

export function ErrorState({
    title = "Something went wrong",
    description = "We encountered an error. Please try again later.",
    onRetry
}: {
    title?: string
    description?: string
    onRetry?: () => void
}) {
    return (
        <EmptyState
            icon={<AlertCircle className="h-16 w-16 text-destructive" />}
            title={title}
            description={description}
            action={onRetry ? {
                label: "Try Again",
                onClick: onRetry
            } : undefined}
        />
    )
}
