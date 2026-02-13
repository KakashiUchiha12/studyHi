"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, Eye, Edit, Trash2 } from "lucide-react"
import { Subject } from "@prisma/client"
import { getColorHex } from "@/lib/utils/colors"

interface SortableSubjectCardProps {
    subject: Subject
    onView: (subject: Subject) => void
    onEdit: (subject: Subject) => void
    onDelete: (subject: Subject) => void
}

export function SortableSubjectCard({ subject, onView, onEdit, onDelete }: SortableSubjectCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: subject.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={`hover:shadow-md transition-all ${isDragging ? "ring-2 ring-primary ring-offset-2 z-10" : ""}`}
        >
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div
                            {...attributes}
                            {...listeners}
                            className="group/drag p-1 -ml-1 rounded hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing touch-none"
                        >
                            <GripVertical className="h-4 w-4 text-muted-foreground transition-opacity" />
                        </div>
                        <div
                            className="h-3 w-3 rounded-full border border-border"
                            style={{ backgroundColor: getColorHex(subject.color) }}
                            title={subject.color}
                        />
                        <CardTitle className="text-lg">{subject.name}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(subject)}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(subject)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(subject)}
                        >
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
                <CardDescription className="line-clamp-2">
                    {subject.code || "No code provided"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Description */}
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Description</span>
                        <span className="font-medium">
                            {subject.description || 'No description'}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{Math.round(subject.progress || 0)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${subject.progress || 0}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{subject.completedChapters || 0} of {subject.totalChapters || 0} chapters</span>
                        </div>
                    </div>

                    {/* Subject Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Credits:</span>
                            <span className="ml-2 font-medium">{subject.credits || 3}</span>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Instructor:</span>
                            <span className="ml-2 font-medium">{subject.instructor || 'Not assigned'}</span>
                        </div>
                        {subject.nextExam && (
                            <div className="col-span-2">
                                <span className="text-muted-foreground">Next Exam:</span>
                                <span className="ml-2 font-medium">
                                    {new Date(subject.nextExam).toLocaleDateString()}
                                </span>
                            </div>
                        )}
                        <div className="col-span-2">
                            <span className="text-muted-foreground">Assignments Due:</span>
                            <span className="ml-2 font-medium">{subject.assignmentsDue || 0}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
