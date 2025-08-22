"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Search, Plus, ArrowLeft, Timer, Target, Calendar, Edit, Trash2 } from "lucide-react"
import { AddSessionDialog } from "@/components/study-sessions/add-session-dialog"
import { EditSessionDialog } from "@/components/study-sessions/edit-session-dialog"
import { DeleteSessionDialog } from "@/components/study-sessions/delete-session-dialog"
import { StudyTimer } from "@/components/study-sessions/study-timer"
import { StudyGoalsCard } from "@/components/study-sessions/study-goals-card"
import { SessionStatsChart } from "@/components/study-sessions/session-stats-chart"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

interface StudySession {
  id: string
  // Support both old and new data structures
  subjectId?: string
  subjectName?: string
  subject?: string // Old structure
  date: string
  startTime?: string
  endTime?: string
  duration: number // in minutes
  topicsCovered?: string[]
  materialsUsed?: string[]
  notes?: string
  sessionType?: "Focused Study" | "Review" | "Practice" | "Research" | "Group Study"
  productivity?: 1 | 2 | 3 | 4 | 5 // 1-5 rating
  efficiency?: number // Old structure: 1-10 rating
  createdAt: string
}

interface Subject {
  id: string
  name: string
  color: string
}

interface StudyGoal {
  id: string
  type: "daily" | "weekly" | "monthly"
  target: number // in minutes
  current: number
  period: string // e.g., "2024-01" for monthly
}

export default function StudySessionsPage() {
  const { data: session, status } = useSession()
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [studyGoals, setStudyGoals] = useState<StudyGoal[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [selectedSessionType, setSelectedSessionType] = useState<string>("all")
  const [selectedSession, setSelectedSession] = useState<StudySession | null>(null)
  const [dialogState, setDialogState] = useState<{
    add: boolean
    edit: boolean
    delete: boolean
  }>({
    add: false,
    edit: false,
    delete: false,
  })
  const router = useRouter()

  useEffect(() => {
    // Check authentication using NextAuth
    if (status === "loading") return // Wait for session to load
    
    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    // Load subjects
    const savedSubjects = localStorage.getItem("subjects")
    if (savedSubjects) {
      try {
        setSubjects(JSON.parse(savedSubjects))
      } catch (error) {
        console.error('Failed to parse saved subjects:', error)
        localStorage.removeItem("subjects")
        setSubjects([])
      }
    }

    // Load study sessions from localStorage
    const savedSessions = localStorage.getItem("studySessions")
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          date: new Date(session.date)
        }))
        setStudySessions(parsedSessions)
      } catch (error) {
        console.error('Failed to parse saved sessions:', error)
        localStorage.removeItem("studySessions")
        setStudySessions([])
      }
    }

    // Load study goals from localStorage
    const savedGoals = localStorage.getItem("studyGoals")
    if (savedGoals) {
      try {
        const parsedGoals = JSON.parse(savedGoals)
        setStudyGoals(parsedGoals)
      } catch (error) {
        console.error('Failed to parse saved goals:', error)
        localStorage.removeItem("studyGoals")
        setStudyGoals(defaultGoals)
      }
    }
  }, [router, status])

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading study sessions...</p>
        </div>
      </div>
    )
  }

  // Show sign-in prompt if not authenticated
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view study sessions</h1>
          <Button onClick={() => router.push("/auth/login")}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  const getWeekString = (date: Date) => {
    const year = date.getFullYear()
    const week = Math.ceil(((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7)
    return `${year}-W${week}`
  }

  const filteredSessions = studySessions.filter((session) => {
    // Handle both old and new data structures
    const subjectName = session.subjectName || session.subject || 'Unknown Subject'
    const topicsCovered = session.topicsCovered || []
    const subjectId = session.subjectId || session.subject || 'unknown'
    const sessionType = session.sessionType || 'Focused Study'
    
    const matchesSearch =
      subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topicsCovered.some((topic) => topic.toLowerCase().includes(searchQuery.toLowerCase())) ||
      session.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = selectedSubject === "all" || subjectId === selectedSubject
    const matchesSessionType = selectedSessionType === "all" || sessionType === selectedSessionType
    return matchesSearch && matchesSubject && matchesSessionType
  })

  const handleAddSession = (newSession: Omit<StudySession, "id" | "createdAt">) => {
    const session: StudySession = {
      ...newSession,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    }

    const updatedSessions = [...studySessions, session]
    setStudySessions(updatedSessions)
    localStorage.setItem("studySessions", JSON.stringify(updatedSessions))
    setDialogState({ ...dialogState, add: false })

    // Update study goals
    updateStudyGoals(session.duration, session.date)
  }

  const handleEditSession = (updatedSession: StudySession) => {
    const originalSession = studySessions.find((s) => s.id === updatedSession.id)
    const updatedSessions = studySessions.map((session) =>
      session.id === updatedSession.id ? updatedSession : session,
    )
    setStudySessions(updatedSessions)
    localStorage.setItem("studySessions", JSON.stringify(updatedSessions))
    setDialogState({ ...dialogState, edit: false })
    setSelectedSession(null)

    // Update study goals (subtract old duration, add new duration)
    if (originalSession) {
      updateStudyGoals(-originalSession.duration, originalSession.date)
      updateStudyGoals(updatedSession.duration, updatedSession.date)
    }
  }

  const handleDeleteSession = (sessionId: string) => {
    const sessionToDelete = studySessions.find((s) => s.id === sessionId)
    const updatedSessions = studySessions.filter((session) => session.id !== sessionId)
    setStudySessions(updatedSessions)
    localStorage.setItem("studySessions", JSON.stringify(updatedSessions))
    setDialogState({ ...dialogState, delete: false })
    setSelectedSession(null)

    // Update study goals (subtract deleted session duration)
    if (sessionToDelete) {
      updateStudyGoals(-sessionToDelete.duration, sessionToDelete.date)
    }
  }

  const updateStudyGoals = (durationChange: number, sessionDate: string) => {
    const date = new Date(sessionDate)
    const dayString = sessionDate
    const weekString = getWeekString(date)
    const monthString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

    const updatedGoals = studyGoals.map((goal) => {
      if (
        (goal.type === "daily" && goal.period === dayString) ||
        (goal.type === "weekly" && goal.period === weekString) ||
        (goal.type === "monthly" && goal.period === monthString)
      ) {
        return {
          ...goal,
          current: Math.max(0, goal.current + durationChange),
        }
      }
      return goal
    })

    setStudyGoals(updatedGoals)
    localStorage.setItem("studyGoals", JSON.stringify(updatedGoals))
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours === 0) return `${mins}m`
    if (mins === 0) return `${hours}h`
    return `${hours}h ${mins}m`
  }

  const getProductivityColor = (rating: number) => {
    if (rating >= 4) return "text-accent"
    if (rating >= 3) return "text-primary"
    if (rating >= 2) return "text-chart-1"
    return "text-destructive"
  }

  const getProductivityText = (rating: number) => {
    const labels = ["Very Low", "Low", "Average", "Good", "Excellent"]
    return labels[rating - 1]
  }

  // Calculate statistics
  const stats = {
    totalSessions: filteredSessions.length,
    totalTime: filteredSessions.reduce((sum, session) => sum + session.duration, 0),
    averageSession:
      filteredSessions.length > 0
        ? Math.round(filteredSessions.reduce((sum, session) => sum + session.duration, 0) / filteredSessions.length)
        : 0,
    averageProductivity:
      filteredSessions.length > 0
        ? Math.round(
            (filteredSessions.reduce((sum, session) => sum + (session.productivity || session.efficiency || 3), 0) / filteredSessions.length) * 10,
          ) / 10
        : 0,
  }

  const defaultGoals: StudyGoal[] = [
    {
      id: "daily",
      type: "daily",
      target: 120, // 2 hours
      current: 0,
      period: new Date().toISOString().split("T")[0],
    },
    {
      id: "weekly",
      type: "weekly",
      target: 600, // 10 hours
      current: 0,
      period: getWeekString(new Date()),
    },
    {
      id: "monthly",
      type: "monthly",
      target: 2400, // 40 hours
      current: 0,
      period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="px-2 sm:px-3">
                  <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="text-lg sm:text-xl font-bold text-foreground">Study Sessions</span>
              </div>
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
              <StudyTimer onSessionComplete={handleAddSession} subjects={subjects} />
              <ThemeToggle />
              <Button 
                onClick={() => setDialogState({ ...dialogState, add: true })}
                size="sm"
                className="px-2 sm:px-3"
              >
                <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Log Session</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-4 py-6 sm:py-8 lg:px-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Study Sessions</h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">Track your study time and monitor learning progress</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSessions}</div>
              <p className="text-xs text-muted-foreground">Study sessions logged</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Time</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.totalTime)}</div>
              <p className="text-xs text-muted-foreground">Time invested</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Session</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.averageSession)}</div>
              <p className="text-xs text-muted-foreground">Per session</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productivity</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageProductivity}/5</div>
              <p className="text-xs text-muted-foreground">Average rating</p>
            </CardContent>
          </Card>
        </div>

        {/* Study Goals and Charts */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          <StudyGoalsCard goals={studyGoals} onUpdateGoals={setStudyGoals} />
          <div className="lg:col-span-2">
            <SessionStatsChart 
              data={filteredSessions.map(session => ({
                date: new Date(session.date).toISOString().split('T')[0],
                duration: session.duration,
                sessions: 1
              }))} 
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col space-y-3 sm:space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search sessions, topics, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSessionType} onValueChange={setSelectedSessionType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Focused Study">Focused Study</SelectItem>
              <SelectItem value="Review">Review</SelectItem>
              <SelectItem value="Practice">Practice</SelectItem>
              <SelectItem value="Research">Research</SelectItem>
              <SelectItem value="Group Study">Group Study</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Study Sessions List */}
        {filteredSessions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery || selectedSubject !== "all" || selectedSessionType !== "all"
                  ? "No sessions found"
                  : "No study sessions yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedSubject !== "all" || selectedSessionType !== "all"
                  ? "Try adjusting your filters"
                  : "Start tracking your study time by logging your first session"}
              </p>
              {!searchQuery && selectedSubject === "all" && selectedSessionType === "all" && (
                <Button onClick={() => setDialogState({ ...dialogState, add: true })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Your First Session
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredSessions
              .sort(
                (a, b) =>
                  new Date(`${b.date} ${b.startTime}`).getTime() - new Date(`${a.date} ${a.startTime}`).getTime(),
              )
              .map((session) => (
                <Card key={session.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{session.subjectName || session.subject || 'Unknown Subject'}</h3>
                                                      <Badge variant="outline">{session.sessionType || 'Focused Study'}</Badge>
                          <Badge variant="secondary">{formatDuration(session.duration)}</Badge>
                          <div className={`flex items-center space-x-1 ${getProductivityColor(session.productivity || session.efficiency || 3)}`}>
                            <Target className="h-4 w-4" />
                            <span className="text-sm font-medium">{getProductivityText(session.productivity || session.efficiency || 3)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-3">
                          <span>
                            {new Date(session.date).toLocaleDateString()}
                            {session.startTime && session.endTime && ` • ${session.startTime} - ${session.endTime}`}
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-sm font-medium text-foreground">Topics Covered:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(session.topicsCovered || []).map((topic, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-foreground">Materials Used:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(session.materialsUsed || []).map((material, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {material}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {session.notes && (
                            <div>
                              <span className="text-sm font-medium text-foreground">Notes:</span>
                              <p className="text-sm text-muted-foreground mt-1 italic">"{session.notes}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSession(session)
                            setDialogState({ ...dialogState, edit: true })
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedSession(session)
                            setDialogState({ ...dialogState, delete: true })
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <AddSessionDialog
        open={dialogState.add}
        onOpenChange={(open) => setDialogState({ ...dialogState, add: open })}
        subjects={subjects}
        onAddSession={handleAddSession}
      />

      {selectedSession && (
        <>
          <EditSessionDialog
            open={dialogState.edit}
            onOpenChange={(open) => setDialogState({ ...dialogState, edit: open })}
            session={selectedSession as any}
            subjects={subjects}
            onEditSession={handleEditSession}
          />

          <DeleteSessionDialog
            open={dialogState.delete}
            onOpenChange={(open) => setDialogState({ ...dialogState, delete: open })}
            session={selectedSession as any}
            onDeleteSession={handleDeleteSession}
          />
        </>
      )}
    </div>
  )
}
