"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: "default" | "destructive"
}

export function ConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default"
}: ConfirmationDialogProps) {
    const handleConfirm = () => {
        onConfirm()
        onOpenChange(false)
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        className={
                            variant === "destructive"
                                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                : ""
                        }
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

// Specialized confirmation dialogs
export function DeleteAssignmentDialog({
    open,
    onOpenChange,
    onConfirm,
    assignmentTitle
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    assignmentTitle: string
}) {
    return (
        <ConfirmationDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
            title="Delete Assignment"
            description={`Are you sure you want to delete "${assignmentTitle}"? This will permanently delete all student submissions and cannot be undone.`}
            confirmText="Delete Assignment"
            variant="destructive"
        />
    )
}

export function RemoveMemberDialog({
    open,
    onOpenChange,
    onConfirm,
    memberName
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    memberName: string
}) {
    return (
        <ConfirmationDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
            title="Remove Member"
            description={`Are you sure you want to remove ${memberName} from this class? They will lose access to all class content.`}
            confirmText="Remove Member"
            variant="destructive"
        />
    )
}

export function LeaveClassDialog({
    open,
    onOpenChange,
    onConfirm,
    className
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    className: string
}) {
    return (
        <ConfirmationDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
            title="Leave Class"
            description={`Are you sure you want to leave "${className}"? You will need to request to join again or use an invite code.`}
            confirmText="Leave Class"
            variant="destructive"
        />
    )
}

export function ChangeRoleDialog({
    open,
    onOpenChange,
    onConfirm,
    memberName,
    newRole
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    memberName: string
    newRole: string
}) {
    const roleDescriptions = {
        admin: "Admins can create assignments and posts, submit assignments, but cannot grade or edit assignments.",
        teacher: "Teachers have full permissions including creating, editing, grading assignments, and managing members.",
        student: "Students can view content, submit assignments, and participate based on class settings."
    }

    return (
        <ConfirmationDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
            title="Change Member Role"
            description={`Change ${memberName}'s role to ${newRole}? ${roleDescriptions[newRole as keyof typeof roleDescriptions] || ''}`}
            confirmText="Change Role"
        />
    )
}

export function GradeSubmissionDialog({
    open,
    onOpenChange,
    onConfirm,
    studentName,
    grade
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    studentName: string
    grade: number
}) {
    return (
        <ConfirmationDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
            title="Submit Grade"
            description={`Submit grade of ${grade}/100 for ${studentName}? Students will be notified of their grade.`}
            confirmText="Submit Grade"
        />
    )
}
