"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
    ArrowLeft,
    Calendar,
    Clock,
    FileText,
    CheckCircle2,
    XCircle,
    Download,
    MoreVertical,
    Edit,
    ExternalLink
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Assignment, Submission, ClassRole } from "@/types/classes"
import { format } from "date-fns"

export default function AssignmentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { data: session, status } = useSession()

    const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [userRole, setUserRole] = useState<ClassRole | null>(null)
    const [loading, setLoading] = useState(true)
    const [gradingLoading, setGradingLoading] = useState<string | null>(null)

    const classId = params.id as string
    const assignmentId = params.assignmentId as string
    const userId = (session?.user as any)?.id

    useEffect(() => {
        if (status === "loading") return
        if (status === "unauthenticated") {
            router.push("/auth/login")
            return
        }
        loadData()
    }, [status, classId, assignmentId])

    const loadData = async () => {
        try {
            setLoading(true)

            // 1. Load class info to get role
            const classRes = await fetch(`/api/classes/${classId}`)
            if (!classRes.ok) throw new Error("Failed to load class")
            const classData = await classRes.json()
            const role = classData.role || classData.userRole
            setUserRole(role)

            // 2. Load assignment details
            const assignmentRes = await fetch(`/api/classes/${classId}/assignments/${assignmentId}`)
            if (!assignmentRes.ok) throw new Error("Assignment not found")
            const assignmentData = await assignmentRes.json()

            // Parse attachments if they come from the associated post
            if (assignmentData.post?.attachments) {
                assignmentData.attachments = JSON.parse(assignmentData.post.attachments)
            } else if (typeof assignmentData.attachments === 'string') {
                assignmentData.attachments = JSON.parse(assignmentData.attachments)
            }

            setAssignment(assignmentData)

            // 3. Load submissions if teacher/admin
            if (role === 'admin' || role === 'teacher') {
                const submissionsRes = await fetch(`/api/classes/${classId}/assignments/${assignmentId}/submissions`)
                if (submissionsRes.ok) {
                    const submissionsData = await submissionsRes.json()
                    setSubmissions(submissionsData.map((s: any) => ({
                        ...s,
                        files: typeof s.files === 'string' ? JSON.parse(s.files) : s.files
                    })))
                }
            } else {
                // Load student's own submission if available (it might be in the assignment object if we optimized the API, but let's be safe)
                const mySubRes = await fetch(`/api/classes/${classId}/assignments/${assignmentId}/submissions`)
                if (mySubRes.ok) {
                    const myData = await mySubRes.json()
                    // For students, the API might only return their own if restricted, or we filter
                    const mySub = myData.find((s: any) => s.studentId === userId)
                    if (mySub) {
                        setSubmissions([{
                            ...mySub,
                            files: typeof mySub.files === 'string' ? JSON.parse(mySub.files) : mySub.files
                        }])
                    }
                }
            }

        } catch (error) {
            console.error("Error loading assignment details:", error)
            toast.error("Failed to load assignment")
            router.push(`/classes/${classId}`)
        } finally {
            setLoading(false)
        }
    }

    const handleGrade = async (submissionId: string) => {
        const grade = prompt("Enter grade (0-100):")
        if (grade === null) return

        const gradeNum = parseInt(grade)
        if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) {
            toast.error("Please enter a valid grade between 0 and 100")
            return
        }

        const feedback = prompt("Enter feedback (optional):") || ""

        try {
            setGradingLoading(submissionId)
            const res = await fetch(`/api/classes/${classId}/assignments/${assignmentId}/grade`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ submissionId, grade: gradeNum, feedback })
            })

            if (!res.ok) throw new Error("Failed to grade submission")

            toast.success("Graded successfully")
            loadData()
        } catch (error) {
            console.error("Grading error:", error)
            toast.error("Failed to grade submission")
        } finally {
            setGradingLoading(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background p-8">
                <div className="mx-auto max-w-5xl space-y-6">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        )
    }

    if (!assignment) return null

    const isTeacherOrAdmin = userRole === 'admin' || userRole === 'teacher'
    const dueDate = new Date(assignment.dueDate)

    return (
        <div className="min-h-screen bg-background pb-12">
            <header className="border-b bg-card py-4">
                <div className="mx-auto max-w-7xl px-4 flex items-center justify-between">
                    <Link href={`/classes/${classId}`}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Class
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline">{userRole?.toUpperCase()}</Badge>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-8 space-y-8">
                {/* Assignment Header Card */}
                <Card>
                    <CardHeader className="pb-4">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                                <CardTitle className="text-3xl font-bold">{assignment.title}</CardTitle>
                                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-1 text-primary" />
                                        Due: {format(dueDate, "PPP")}
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1 text-primary" />
                                        {format(dueDate, "p")}
                                    </div>
                                    <div className="flex items-center">
                                        <FileText className="h-4 w-4 mr-1 text-primary" />
                                        100 Points
                                    </div>
                                </div>
                            </div>
                            {isTeacherOrAdmin && (
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                            <p className="whitespace-pre-wrap text-base">{assignment.description}</p>
                        </div>

                        {assignment.attachments && assignment.attachments.length > 0 && (
                            <div className="pt-6 border-t">
                                <h3 className="text-sm font-semibold mb-3 flex items-center">
                                    <FileText className="h-4 w-4 mr-2" />
                                    Reference Materials
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {assignment.attachments.map((url, index) => (
                                        <a
                                            key={index}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center p-3 rounded-lg border bg-muted/50 hover:bg-muted transition-colors group"
                                        >
                                            <FileText className="h-8 w-8 text-primary mr-3 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                                    {url.split('/').pop() || `Material ${index + 1}`}
                                                </p>
                                                <p className="text-xs text-muted-foreground">Resource</p>
                                            </div>
                                            <ExternalLink className="h-4 w-4 text-muted-foreground ml-2" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Submissions Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">
                            {isTeacherOrAdmin ? "Student Submissions" : "Your Submission"}
                        </h2>
                        {isTeacherOrAdmin && (
                            <Badge variant="secondary" className="px-3 py-1">
                                {submissions.length} Turned in
                            </Badge>
                        )}
                    </div>

                    {isTeacherOrAdmin ? (
                        <div className="grid gap-4">
                            {submissions.length === 0 ? (
                                <div className="text-center py-12 border rounded-xl bg-card">
                                    <p className="text-muted-foreground">No submissions yet.</p>
                                </div>
                            ) : (
                                submissions.map((submission) => (
                                    <Card key={submission.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={submission.student?.image || undefined} />
                                                        <AvatarFallback>{submission.student?.name?.[0] || "S"}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{submission.student?.name || submission.student?.email}</p>
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                            {submission.isLate ? (
                                                                <span className="text-amber-600 flex items-center italic">
                                                                    <Clock className="h-3 w-3 mr-1" /> Turned in late
                                                                </span>
                                                            ) : (
                                                                <span className="text-green-600 flex items-center">
                                                                    <CheckCircle2 className="h-3 w-3 mr-1" /> On time
                                                                </span>
                                                            )}
                                                            • {format(new Date(submission.submittedAt), "MMM d, p")}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                                                    <div className="text-right mr-4 hidden md:block">
                                                        <p className="text-xs text-muted-foreground">Files</p>
                                                        <p className="text-sm font-medium">{submission.files?.length || 0} attached</p>
                                                    </div>

                                                    <div className="flex-1 sm:flex-none">
                                                        {submission.grade !== null ? (
                                                            <div className="text-right px-4 border-l">
                                                                <p className="text-xs text-muted-foreground">Grade</p>
                                                                <p className="text-lg font-bold text-primary">{submission.grade}/100</p>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleGrade(submission.id)}
                                                                disabled={gradingLoading === submission.id}
                                                            >
                                                                {gradingLoading === submission.id ? "..." : "Grade"}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Files in the submission */}
                                            <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {submission.files?.map((file: any, i: number) => (
                                                    <a
                                                        key={i}
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center p-2 rounded border bg-muted/30 hover:bg-muted text-xs truncate"
                                                    >
                                                        <FileText className="h-3 w-3 mr-2 text-primary" />
                                                        <span className="truncate">{file.name}</span>
                                                        <Download className="h-3 w-3 ml-auto text-muted-foreground" />
                                                    </a>
                                                ))}
                                            </div>

                                            {submission.feedback && (
                                                <div className="mt-3 p-2 rounded bg-primary/5 border border-primary/10 text-xs">
                                                    <strong>Feedback:</strong> {submission.feedback}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    ) : (
                        <div>
                            {submissions.length === 0 ? (
                                <div className="text-center py-12 border rounded-xl bg-card">
                                    <p className="text-muted-foreground mb-4">You haven't submitted this assignment yet.</p>
                                    <Button onClick={() => router.push(`/classes/${classId}`)}>
                                        Go to Class Stream to Submit
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {submissions.map((submission) => (
                                        <Card key={submission.id}>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Your Work</CardTitle>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {submission.isLate ? (
                                                            <Badge variant="destructive">Turned in Late</Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-green-500/10 text-green-600">On Time</Badge>
                                                        )}
                                                        <span className="text-sm text-muted-foreground">
                                                            {format(new Date(submission.submittedAt), "PPP p")}
                                                        </span>
                                                    </div>
                                                    {submission.grade !== null && (
                                                        <div className="text-right">
                                                            <p className="text-sm text-muted-foreground">Grade</p>
                                                            <p className="text-3xl font-bold text-primary">{submission.grade}/100</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {submission.files?.map((file: any, i: number) => (
                                                        <div key={i} className="flex items-center p-3 rounded-lg border bg-muted/50">
                                                            <FileText className="h-6 w-6 text-primary mr-3" />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium truncate">{file.name}</p>
                                                                <p className="text-xs text-muted-foreground">Submitted File</p>
                                                            </div>
                                                            <Button variant="ghost" size="icon" asChild>
                                                                <a href={file.url} target="_blank" rel="noopener noreferrer">
                                                                    <Download className="h-4 w-4" />
                                                                </a>
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>

                                                {submission.feedback && (
                                                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                                        <h4 className="text-sm font-semibold mb-1">Teacher Feedback</h4>
                                                        <p className="text-sm">{submission.feedback}</p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}
