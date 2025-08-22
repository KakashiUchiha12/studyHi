

"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { 
  BookOpen, Search, Bell, Settings, LogOut, ChevronDown, Plus, BarChart3,
  CheckCircle2, Circle, X, User, Calendar as CalendarIcon, Clock,
  Flag, Tag, Filter, SortAsc, SortDesc, FileText, Timer, CheckSquare, Square,
  Zap, Download
} from "lucide-react"
import { format, isToday, isTomorrow, isPast, addDays, startOfWeek, endOfWeek, eachDayOfInterval, startOfDay } from "date-fns"
import { ExpandableSection } from "@/components/expandable-section"
import { ProgressiveTaskManager } from "@/components/progressive-task-manager"
import { TaskManager } from "@/components/tasks/task-manager"
import { ClientOnly } from "@/components/client-only"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { useRealtimeSync } from "@/hooks/use-realtime-sync"
import { notificationManager } from "@/lib/notifications"
import { StudyTimer } from "@/components/study-sessions/study-timer"
import TimeTableButton from "@/components/dashboard/TimeTableButton"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"

// Custom hook to avoid hydration mismatch
function useTimeOfDay() {
  const [timeOfDay, setTimeOfDay] = useState('morning');
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 17) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);
  
  return timeOfDay;
}

interface User {
  name: string
  email: string
  university?: string
  program?: string
  year?: number
  avatar?: string
  bio?: string
  badges?: string[]
  isPrivate?: boolean
  studyGoal?: number // daily study goal in hours
  currentStreak?: number // consecutive days of studying
  totalStudyTime?: number // total study time this week
}

interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  createdAt: Date
  dueDate?: Date
  priority: "low" | "medium" | "high"
  category: string
  estimatedTime?: number // in minutes
  tags: string[]
  subject?: string
  progress?: number // 0-100
  timeSpent?: number // in minutes
}

interface TestMark {
  id: string
  date: string | Date
  subjectId: string
  subjectName: string
  marksObtained: number
  totalMarks: number
  title?: string
  percentage?: number
  grade?: string
}

interface StudySession {
  id: string
  subject: string
  duration: number // in minutes
  date: Date
  notes?: string
  efficiency?: number // 1-10 rating
  sessionType?: "Focused Study" | "Review" | "Practice" | "Research" | "Group Study"
  productivity?: 1 | 2 | 3 | 4 | 5
  topicsCovered?: string[]
  materialsUsed?: string[]
}

interface Subject {
  id: string
  name: string
  code: string
  credits: number
  instructor: string
  color: string
  progress: number // 0-100
  nextExam?: Date
  assignmentsDue?: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  
  // Real-time sync
  const { triggerUpdate } = useRealtimeSync({
    onDataUpdate: (data) => {
      // Handle real-time data updates
      console.log("Real-time data update:", JSON.stringify(data, null, 2))
    }
  })
  const [showTasks, setShowTasks] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: undefined as Date | undefined,
    priority: "medium" as "low" | "medium" | "high",
    category: "",
    estimatedTime: 0,
    tags: [] as string[]
  })

  const [newStudySession, setNewStudySession] = useState({
    subjectId: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    sessionType: "" as "Focused Study" | "Review" | "Practice" | "Research" | "Group Study" | "",
    productivity: 3 as 1 | 2 | 3 | 4 | 5,
    notes: "",
  })
  const [topicsCovered, setTopicsCovered] = useState<string[]>([])
  const [materialsUsed, setMaterialsUsed] = useState<string[]>([])
  const [newTopic, setNewTopic] = useState("")
  const [newMaterial, setNewMaterial] = useState("")

  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showCreateStudySession, setShowCreateStudySession] = useState(false)
  const [showStudyTimer, setShowStudyTimer] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [taskFilter, setTaskFilter] = useState("all") // all, pending, completed, overdue
  const [taskSort, setTaskSort] = useState("dueDate") // dueDate, priority, createdAt
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [testMarks, setTestMarks] = useState<TestMark[]>([])
  const [studySessions, setStudySessions] = useState<StudySession[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  // Consolidated date state management
  const [dateState, setDateState] = useState<{
    selected: Date;
    currentMonth: number;
    currentYear: number;
  }>({
    selected: new Date(),
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear()
  })
  
  const setSelectedDate = (date: Date) => setDateState(prev => ({ ...prev, selected: date }))
  const setCurrentMonth = (month: number) => setDateState(prev => ({ ...prev, currentMonth: month }))
  const setCurrentYear = (year: number) => setDateState(prev => ({ ...prev, currentYear: year }))
  const { selected: selectedDate, currentMonth, currentYear } = dateState

  // Helper function to get study goal from settings
  const getStudyGoal = () => {
    const savedSettings = localStorage.getItem("userSettings")
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings)
        return settings.studyGoals?.dailyHours || 4
      } catch (error) {
        return 4
      }
    }
    return 4
  }

  // Helper function to convert minutes to hours and minutes format
  const convertMinutesToHoursAndMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    
    if (hours === 0) {
      return `${remainingMinutes}m`
    } else if (remainingMinutes === 0) {
      return `${hours}h`
    } else {
      return `${hours}h ${remainingMinutes}m`
    }
  }
  


  // Custom hook for debounced localStorage persistence
  const useDebouncedPersistence = (key: string, data: any, delay = 300) => {
    const timeoutRef = useRef<NodeJS.Timeout>()
    const isInitialMount = useRef(true)
    
    useEffect(() => {
      // Skip persistence on initial mount to avoid overwriting with default values
      if (isInitialMount.current) {
        isInitialMount.current = false
        return
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(key, JSON.stringify(data))
        } catch (error) {
          console.warn(`Failed to persist ${key}:`, error)
        }
      }, delay)
      
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [key, data, delay])
  }

  // Use debounced persistence for better performance
  useDebouncedPersistence('tasks', tasks)
  useDebouncedPersistence('studySessions', studySessions)
  useDebouncedPersistence('subjects', subjects)
  useDebouncedPersistence('testMarks', testMarks)

  const router = useRouter()



  // Unified priority utility functions
  const getPriorityConfig = useCallback((priority: string) => {
    const configs = {
      high: {
        color: "text-red-600 bg-red-100 dark:bg-red-900/20",
        icon: <Flag className="h-3 w-3 fill-current" />,
        label: "High Priority"
      },
      medium: {
        color: "text-orange-600 bg-orange-100 dark:bg-orange-900/20",
        icon: <Flag className="h-3 w-3" />,
        label: "Medium Priority"
      },
      low: {
        color: "text-green-600 bg-green-100 dark:bg-green-900/20",
        icon: <Flag className="h-3 w-3" />,
        label: "Low Priority"
      }
    }
    return configs[priority as keyof typeof configs] || configs.medium
  }, [])

  const getPriorityColor = useCallback((priority: string) => getPriorityConfig(priority).color, [getPriorityConfig])
  const getPriorityIcon = useCallback((priority: string) => getPriorityConfig(priority).icon, [getPriorityConfig])



  // Task management functions - optimized with useCallback
  // Optimized task management functions using functional updates
  const toggleTaskComplete = useCallback((taskId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    )
  }, [])

  const updateTaskProgress = useCallback((taskId: string, progress: number) => {
    setTasks(prevTasks => 
      prevTasks.map(task =>
        task.id === taskId ? { ...task, progress } : task
      )
    )
  }, [])

  const addTimeToTask = useCallback((taskId: string, minutes: number) => {
    setTasks(prevTasks => 
      prevTasks.map(task =>
        task.id === taskId ? { ...task, timeSpent: (task.timeSpent || 0) + minutes } : task
      )
    )
  }, [])

  // Date picker helper functions
  const getMonthName = (month: number) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December']
    return months[month]
  }

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay()
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    } else {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  }

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    if (session?.user) {
      setUser({
        name: session.user.name || "User",
        email: session.user.email || "",
        university: "University of Technology",
        program: "Computer Science",
        year: 3,
        avatar: "/placeholder-user.jpg",
        bio: "Passionate student focused on software engineering and AI",

        badges: ["Academic Excellence", "Study Streak", "Top Performer"],
        isPrivate: false,
        studyGoal: 4, // 4 hours daily goal
        currentStreak: 5,
        totalStudyTime: 0
      })
    }

    // Load study sessions
    const savedStudySessions = localStorage.getItem("studySessions")
    if (savedStudySessions) {
      try {
        const parsed = JSON.parse(savedStudySessions).map((session: any) => ({
          ...session,
          date: new Date(session.date)
        }))
        setStudySessions(parsed)
      } catch (error) {
        console.error('Failed to parse saved study sessions:', error)
        localStorage.removeItem("studySessions")
        setStudySessions([])
      }
    }

    // Load subjects
    const savedSubjects = localStorage.getItem("subjects")
    if (savedSubjects) {
      try {
        const parsed = JSON.parse(savedSubjects).map((subject: any) => ({
          ...subject,
          nextExam: subject.nextExam ? new Date(subject.nextExam) : undefined
        }))
        setSubjects(parsed)
      } catch (error) {
        console.error('Failed to parse saved subjects:', error)
        // Set default subjects if none exist
        setSubjects([
          {
            id: "1",
            name: "Computer Science",
            code: "CS101",
            credits: 3,
            instructor: "Dr. Smith",
            color: "#3B82F6",
            progress: 75,
            assignmentsDue: 2
          },
          {
            id: "2",
            name: "Mathematics",
            code: "MATH201",
            credits: 4,
            instructor: "Prof. Johnson",
            color: "#10B981",
            progress: 60,
            nextExam: addDays(new Date(), 7)
          }
        ])
      }
    }

    const savedTasks = localStorage.getItem("tasks")
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks).map((task: any) => ({
          ...task,
          createdAt: new Date(task.createdAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined
        }))
        setTasks(parsedTasks)
      } catch (error) {
        console.error('Failed to parse saved tasks:', error)
        // Clear corrupted data and start fresh
        localStorage.removeItem("tasks")
        setTasks([])
      }
    }

    const savedTestMarks = localStorage.getItem("testMarks")
    if (savedTestMarks) {
      try {
        setTestMarks(JSON.parse(savedTestMarks))
      } catch (error) {
        console.error('Failed to parse saved test marks:', error)
        // Clear corrupted data and start fresh
        localStorage.removeItem("testMarks")
        setTestMarks([])
      }
    }

    

    // Restore dashboard section open state
    try {
      const savedSections = localStorage.getItem("dashboard:sections")
      if (savedSections) {
        const parsed = JSON.parse(savedSections)
        if (typeof parsed?.tasks === "boolean") setShowTasks(parsed.tasks)

      }
    } catch (e) {
      // ignore parse errors
    }

    // Check for pending notifications
    notificationManager.checkPendingNotifications()
  }, [router, session, status])

  // Persist dashboard section open state
  useEffect(() => {
    try {
      localStorage.setItem(
        "dashboard:sections",
        JSON.stringify({ tasks: showTasks })
      )
    } catch (e) {
      // ignore write errors
    }
  }, [showTasks])

  // Debug: Monitor newTask.dueDate changes
  useEffect(() => {
    // Removed debug logging for production
  }, [newTask.dueDate])

  const addTask = () => {
    if (!newTask.title.trim()) return

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      completed: false,
      createdAt: new Date(),
      dueDate: newTask.dueDate,
      priority: newTask.priority,
      category: newTask.category,
      estimatedTime: newTask.estimatedTime,
      tags: newTask.tags
    }

    setTasks(prevTasks => {
      const updatedTasks = [...prevTasks, task]
      // Use updatedTasks instead of tasks state variable
      localStorage.setItem("tasks", JSON.stringify(updatedTasks))
      return updatedTasks
    })
    
    // Trigger real-time sync
    triggerUpdate("task-updated", { type: "created", task })
    
    // Schedule deadline notification if due date is set
    if (task.dueDate) {
      notificationManager.notifyTaskDeadline(task.title, task.dueDate)
    }
    
    // Reset form
    setNewTask({
      title: "",
      description: "",
      dueDate: undefined,
      priority: "medium",
      category: "",
      estimatedTime: 0,
      tags: []
    })
    setShowCreateTask(false)
  }

  const addStudySession = () => {
    if (!newStudySession.subjectId || !newStudySession.sessionType || !newStudySession.startTime || !newStudySession.endTime) return

    const selectedSubject = subjects.find((s) => s.id === newStudySession.subjectId)
    if (!selectedSubject) return

    const duration = calculateDuration(newStudySession.startTime, newStudySession.endTime)
    if (duration <= 0) return

    const session: StudySession = {
      id: Date.now().toString(),
      subject: selectedSubject.name,
      duration,
      date: new Date(newStudySession.date),
      notes: newStudySession.notes.trim(),
      sessionType: newStudySession.sessionType as "Focused Study" | "Review" | "Practice" | "Research" | "Group Study",
      productivity: newStudySession.productivity,
      topicsCovered,
      materialsUsed
    }

    const updatedSessions = [...studySessions, session]
    setStudySessions(updatedSessions)
    
    // Trigger real-time sync
    triggerUpdate("study-session-updated", { type: "created", session })
    
    // Reset form
    setNewStudySession({
      subjectId: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "",
      endTime: "",
      sessionType: "",
      productivity: 3,
      notes: "",
    })
    setTopicsCovered([])
    setMaterialsUsed([])
    setNewTopic("")
    setNewMaterial("")
    setShowCreateStudySession(false)
  }

  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 0
    const startTime = new Date(`2000-01-01T${start}:00`)
    const endTime = new Date(`2000-01-01T${end}:00`)
    const diff = endTime.getTime() - startTime.getTime()
    return Math.max(0, Math.round(diff / (1000 * 60))) // Convert to minutes
  }

  const addTopic = () => {
    if (newTopic.trim() && !topicsCovered.includes(newTopic.trim())) {
      setTopicsCovered([...topicsCovered, newTopic.trim()])
      setNewTopic("")
    }
  }

  const removeTopic = (index: number) => {
    setTopicsCovered(topicsCovered.filter((_, i) => i !== index))
  }

  const addMaterial = () => {
    if (newMaterial.trim() && !materialsUsed.includes(newMaterial.trim())) {
      setMaterialsUsed([...materialsUsed, newMaterial.trim()])
      setNewMaterial("")
    }
  }

  const removeMaterial = (index: number) => {
    setMaterialsUsed(materialsUsed.filter((_, i) => i !== index))
  }

  const removeTask = (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId)
    setTasks(updatedTasks)
  }

  // Memoized calculations for better performance
  const todayStudyTime = useMemo(() => {
    const today = new Date()
    return studySessions
      .filter(session => isToday(session.date))
      .reduce((total, session) => total + session.duration, 0)
  }, [studySessions])

  const weeklyStudyTime = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
    return studySessions
      .filter(session => session.date >= weekStart && session.date <= weekEnd)
      .reduce((total, session) => total + session.duration, 0)
  }, [studySessions])

  const studyStreak = useMemo(() => {
    if (studySessions.length === 0) return 0
    
    // Create a Set of date strings for O(1) lookup
    const sessionDates = new Set(
      studySessions.map(session => {
        const date = new Date(session.date)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      })
    )
    
    let streak = 0
    const today = new Date()
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateString = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`
      
      if (sessionDates.has(dateString)) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }, [studySessions])

  const upcomingDeadlines = useMemo(() => {
    const nextWeek = addDays(new Date(), 7)
    return tasks.filter(task => 
      task.dueDate && 
      task.dueDate <= nextWeek && 
      !task.completed
    ).sort((a, b) => (a.dueDate?.getTime() || 0) - (b.dueDate?.getTime() || 0))
  }, [tasks])

  // Helper function for task overdue check
  const isTaskOverdue = (task: Task) => {
    if (!task.dueDate || task.completed) return false;
    return isPast(task.dueDate) && !isToday(task.dueDate);
  };

  const taskStats = useMemo(() => {
    const completed = tasks.filter((task) => task.completed).length
    const pending = tasks.filter((task) => !task.completed).length
    const overdue = tasks.filter((task) => isTaskOverdue(task)).length
    const highPriority = tasks.filter((task) => !task.completed && task.priority === "high").length
    
    return { completed, pending, overdue, highPriority }
  }, [tasks])

  const averageScore = useMemo(() => {
    return testMarks.length > 0
      ? Math.round(testMarks.reduce((sum, test) => {
          // Use percentage if available, otherwise calculate from marks
          if (test.percentage !== undefined && test.percentage !== null) {
            return sum + test.percentage
          } else {
            const marksObtained = test.marksObtained || 0
            const totalMarks = test.totalMarks || 1
            return sum + (marksObtained / totalMarks) * 100
          }
        }, 0) / testMarks.length)
      : 0
  }, [testMarks])

  const subjectsProgress = useMemo(() => {
    return subjects.reduce((sum, s) => sum + s.progress, 0) / Math.max(subjects.length, 1)
  }, [subjects])

  // Unified task update function
  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks => 
      prevTasks.map((task) => 
        task.id === taskId ? { ...task, ...updates } : task
      )
    )
  }, [])



  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" })
  }

  const timeOfDay = useTimeOfDay();

  const formatDueDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM dd");
  };


  if (status === "loading" || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Task filtering and sorting
  const filteredTasks = tasks.filter(task => {
    if (taskFilter === "pending") return !task.completed
    if (taskFilter === "completed") return task.completed
    if (taskFilter === "overdue") return isTaskOverdue(task)
    return true
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0
    
    switch (taskSort) {
      case "dueDate":
        if (!a.dueDate && !b.dueDate) comparison = 0
        else if (!a.dueDate) comparison = 1
        else if (!b.dueDate) comparison = -1
        else comparison = a.dueDate.getTime() - b.dueDate.getTime()
        break
      case "priority":
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
        break
      case "createdAt":
        comparison = a.createdAt.getTime() - b.createdAt.getTime()
        break
    }
    
    return sortDirection === "asc" ? comparison : -comparison
  })

  const { completed: completedTasks, pending: pendingTasks, overdue: overdueTasks, highPriority: highPriorityTasks } = taskStats

  const categories = Array.from(new Set(tasks.map(task => task.category).filter(Boolean)))

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Minimal Header with Glass Effect - Mobile Optimized */}
      <header className="glass-effect border-b border-border/50 sticky top-0 z-40">
        <div className="container-responsive py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3 animate-slide-in-right">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-sm">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg sm:text-heading-2 font-semibold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                StudyPlanner
              </span>
              <p className="text-xs text-muted-foreground hidden sm:block">Your academic companion</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <NotificationCenter />
            <ThemeToggle />
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="h-8 w-8 sm:h-9 sm:w-9 p-0 focus-ring">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 w-8 sm:h-9 sm:w-9 p-0 focus-ring">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Enhanced Search Bar - Mobile Optimized */}
        <div className="border-t border-border/30 bg-gradient-to-r from-muted/20 to-muted/10">
          <div className="container-responsive py-2 sm:py-3">
            <div className="relative animate-fade-in-up">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks, subjects, study sessions..."
                className="input-enhanced pl-10 shadow-sm h-10 sm:h-11 text-sm sm:text-base"
                onChange={(e) => {
                  // Implement search functionality
                  const query = e.target.value.toLowerCase()
                  // You can add search logic here to filter content
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container-responsive py-6 sm:py-8 md:py-12">
        {/* Enhanced Primary Focus View - Mobile Optimized */}
        <div className="text-center space-y-8 sm:space-y-12 animate-fade-in-up">
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-heading-1 font-light text-foreground">
                Good {timeOfDay}, {user.name}
              </h1>
              <p className="text-sm sm:text-caption">Welcome back to your study journey</p>
            </div>
            
            <div className="relative">
              {/* Study Time Display with Enhanced Visual Appeal - Mobile Optimized */}
              <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl bg-gradient-to-br from-card via-card to-muted/20 border border-border/50 shadow-lg">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent-purple/5"></div>
                                  <div className="relative space-y-3 sm:space-y-4">
                    <ClientOnly fallback={<div className="text-4xl sm:text-display font-light bg-gradient-to-r from-primary via-accent-purple to-primary bg-clip-text text-transparent">0h</div>}>
                      <div className="text-4xl sm:text-display font-light bg-gradient-to-r from-primary via-accent-purple to-primary bg-clip-text text-transparent">
                        {Math.round(todayStudyTime / 60 * 10) / 10}h
                      </div>
                    </ClientOnly>
                    <p className="text-base sm:text-body-large text-muted-foreground">
                      of {getStudyGoal()}h daily goal
                    </p>
                  
                  {/* Enhanced Progress Bar - Client Only - Mobile Optimized */}
                  <ClientOnly fallback={
                    <div className="max-w-xs sm:max-w-sm mx-auto space-y-2 sm:space-y-3">
                      <div className="relative h-2.5 sm:h-3 bg-muted rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-muted rounded-full" style={{ width: '0%' }}></div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0h</span>
                        <span className="font-medium">0% complete</span>
                        <span>{user?.studyGoal || 4}h</span>
                      </div>
                    </div>
                  }>
                    <div className="max-w-xs sm:max-w-sm mx-auto space-y-2 sm:space-y-3">
                      <div className="relative h-2.5 sm:h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent-purple rounded-full transition-all duration-700 ease-out shadow-sm"
                          style={{ 
                            width: `${Math.min((todayStudyTime / 60) / getStudyGoal() * 100, 100)}%` 
                          }}
                        >
                          <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0h</span>
                        <span className="font-medium">
                          {Math.round((todayStudyTime / 60) / getStudyGoal() * 100)}% complete
                        </span>
                        <span>{getStudyGoal()}h</span>
                      </div>
                    </div>
                  </ClientOnly>
                </div>
              </div>
            </div>
          </div>
          
          {/* TimeTable Button */}
          <TimeTableButton />
          
          {/* Enhanced Primary Action - Mobile Optimized */}
          <Button 
            size="lg" 
            className="btn-primary-enhanced px-6 sm:px-12 py-3 sm:py-4 text-base sm:text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in w-full sm:w-auto"
            onClick={() => setShowStudyTimer(true)}
          >
            <Timer className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
            Start Study Session
            <div className="ml-2 sm:ml-3 w-2 h-2 bg-accent-green rounded-full animate-pulse"></div>
          </Button>
          
          {/* Urgent Tasks (Progressive Disclosure) - Mobile Optimized */}
          <ClientOnly fallback={null}>
            {upcomingDeadlines.length > 0 && (
              <div className="space-y-3 pt-4 sm:pt-6 border-t border-border/50">
                <h2 className="text-sm font-medium text-muted-foreground">
                  Urgent Tasks
                </h2>
                <div className="space-y-2">
                  {upcomingDeadlines.slice(0, 3).map(task => (
                    <div 
                      key={task.id}
                      className="flex items-center justify-between p-2.5 sm:p-3 bg-muted/30 rounded-lg text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate text-sm sm:text-base">
                          {task.title}
                        </p>
                        <p className="text-xs sm:text-sm text-warning">
                          {task.dueDate ? formatDueDate(task.dueDate) : 'No due date'}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTaskComplete(task.id)}
                        className="ml-2 h-8 w-8 sm:h-9 sm:w-9 p-0"
                      >
                        <Circle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {upcomingDeadlines.length > 3 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowTasks(true)}
                    className="text-primary text-sm"
                  >
                    +{upcomingDeadlines.length - 3} more urgent tasks
                  </Button>
                )}
              </div>
            )}
          </ClientOnly>
          
          {/* Secondary Metrics (Minimal) */}
          <ClientOnly fallback={null}>
            {studyStreak > 0 && (
              <div className="pt-4 text-sm text-muted-foreground">
                🔥 {studyStreak} day study streak
              </div>
            )}
          </ClientOnly>
        </div>

                  {/* Enhanced Progressive Disclosure Sections */}
        <div className="mt-16 space-y-8">
          {/* Study Progress - Expandable */}
          <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <ExpandableSection 
              title="Study Progress" 
              icon={BarChart3}
              defaultExpanded={false}
            >
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <div className="text-xl sm:text-2xl font-light text-primary">
                    {studySessions.filter(s => isToday(s.date)).length}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Sessions Today</p>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-light text-success">
                    {Math.round(weeklyStudyTime / 60)}h
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">This Week</p>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-light text-warning">
                    {studyStreak}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Weekly Goal</span>
                  <span className="text-foreground">
                    {Math.round(weeklyStudyTime / 60)}h / {user?.studyGoal || 4 * 7}h
                  </span>
                </div>
                <Progress value={(weeklyStudyTime / 60) / ((user?.studyGoal || 4) * 7) * 100} className="h-2" />
              </div>
            </div>
          </ExpandableSection>
          </div>

          {/* Quick Actions - Minimal - Mobile Optimized */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 p-2 sm:p-3"
              onClick={() => setShowCreateTask(true)}
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Quick Task</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-16 sm:h-20 flex-col space-y-1 sm:space-y-2 p-2 sm:p-3"
              onClick={() => router.push('/subjects')}
            >
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-xs sm:text-sm">Subjects</span>
            </Button>
          </div>

          {/* Enhanced Quick Actions Dashboard - Expandable - Mobile Optimized */}
          <ExpandableSection 
            title="Quick Actions" 
            icon={Zap}
            defaultExpanded={false}
          >
            <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
              {/* Log Study Session */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowCreateStudySession(true)}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Log Study Session</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Add a completed study session</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Click to log session
                  </div>
                </CardContent>
              </Card>

              {/* Study Sessions */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/study-sessions')}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                      <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Study History</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">View your study sessions</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {studySessions.length} sessions logged
                  </div>
                </CardContent>
              </Card>

              {/* Test Results */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/test-marks')}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Test Results</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Track your performance</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {testMarks.length} tests recorded
                  </div>
                </CardContent>
              </Card>

              {/* Profile */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push('/profile')}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-foreground">Profile</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Manage your account</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {user?.badges?.length || 0} badges earned
                  </div>
                </CardContent>
              </Card>
            </div>
          </ExpandableSection>

          {/* Dashboard Stats - Expandable */}
          <ExpandableSection 
            title="Performance Overview" 
            icon={BarChart3}
            defaultExpanded={false}
          >
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Tasks</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{tasks.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {taskStats.completed} completed, {taskStats.pending} pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Test Average</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">
                    {averageScore}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Based on {testMarks.length} test{testMarks.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Study Streak</CardTitle>
                  <Timer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{studyStreak}</div>
                  <p className="text-xs text-muted-foreground">
                    Days in a row
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Achievements</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{user?.badges?.length || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Badges earned
                  </p>
                </CardContent>
              </Card>
            </div>
          </ExpandableSection>

          {/* Subjects Overview - Expandable */}
          <ExpandableSection 
            title="Subjects Overview" 
            icon={BookOpen}
            defaultExpanded={false}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Your Subjects</h3>
                <Link href="/subjects">
                  <Button variant="outline" size="sm">
                    <BookOpen className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </div>
              
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                {subjects.map((subject) => (
                  <Card key={subject.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: subject.color }}
                          />
                          <h4 className="font-medium">{subject.name}</h4>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {subject.credits} credits
                        </Badge>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{subject.progress}%</span>
                          </div>
                          <Progress value={subject.progress} className="h-2" />
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Instructor:</span>
                            <span>{subject.instructor}</span>
                          </div>
                          {subject.assignmentsDue && subject.assignmentsDue > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Due:</span>
                              <span className="text-orange-600 font-medium">
                                {subject.assignmentsDue} assignment{subject.assignmentsDue !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                          {subject.nextExam && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Next Exam:</span>
                              <span className="text-red-600 font-medium">
                                {format(subject.nextExam, "MMM dd")}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </ExpandableSection>

          {/* Tasks - Expandable */}
          <ExpandableSection 
            title={`Tasks (${tasks.length})`} 
            icon={CheckCircle2}
            defaultExpanded={false}
          >
            <div className="space-y-6">
              {/* Task Summary Stats - Mobile Optimized */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-semibold text-primary">{taskStats.completed}</div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-semibold text-warning">{taskStats.pending}</div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-semibold text-destructive">{taskStats.overdue}</div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-semibold text-orange-600">{taskStats.highPriority}</div>
                  <p className="text-xs text-muted-foreground">High Priority</p>
                </div>
              </div>

              {/* Enhanced Task Manager with Drag & Drop */}
              <div className="min-h-0">
                <TaskManager 
                  tasks={tasks}
                  onTasksChange={setTasks}
                  onOpenCreateDialog={() => setShowCreateTask(true)}
                />
              </div>
            </div>
          </ExpandableSection>

          {/* Comprehensive Analytics - Expandable */}
          <ExpandableSection 
            title="Analytics & Insights" 
            icon={BarChart3}
            defaultExpanded={false}
          >
            <div className="space-y-6">
              {/* Study Time Analytics */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Study Time Analysis</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-semibold text-primary">
                      {convertMinutesToHoursAndMinutes(todayStudyTime)}
                    </div>
                    <p className="text-sm text-muted-foreground">Today</p>
                    <div className="mt-2">
                      <Progress value={(todayStudyTime / 60) / (user?.studyGoal || 4) * 100} className="h-2" />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-semibold text-success">
                      {convertMinutesToHoursAndMinutes(weeklyStudyTime)}
                    </div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <div className="mt-2">
                      <Progress value={(weeklyStudyTime / 60) / ((user?.studyGoal || 4) * 7) * 100} className="h-2" />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-semibold text-warning">
                      {studyStreak}
                    </div>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                    <div className="mt-2 text-xs text-muted-foreground">
                      🔥 Keep it up!
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Performance Overview</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Test Average</span>
                      <span className="text-lg font-semibold text-foreground">{averageScore}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Based on {testMarks.length} test{testMarks.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Subject Progress</span>
                      <span className="text-lg font-semibold text-foreground">{Math.round(subjectsProgress)}%</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Average across {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-3">
                <h4 className="font-medium text-foreground">Recent Activity</h4>
                <div className="space-y-2">
                  {studySessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">{session.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(session.date, "MMM dd, HH:mm")}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm font-medium text-primary">
                        {convertMinutesToHoursAndMinutes(session.duration)}
                      </div>
                    </div>
                  ))}
                  
                  {studySessions.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      No study sessions yet. Start your first session!
                    </p>
                  )}
                </div>
              </div>

              {/* View Full Analytics Button */}
              <div className="pt-4 border-t border-border/30">
                <Link href="/analytics">
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Full Analytics
                  </Button>
                </Link>
              </div>
            </div>
          </ExpandableSection>


        </div>
      </main>

      {/* Back to Top Button - Mobile Optimized */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-4 right-4 z-50 rounded-full h-12 w-12 p-0 bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg hover:bg-background/90 hover:shadow-xl transition-all duration-200 focus-ring md:hidden"
        title="Back to Top"
      >
        <ChevronDown className="h-5 w-5 rotate-180" />
      </Button>

      {/* Enhanced Study Timer Component */}
      <StudyTimer 
        subjects={subjects}
        isOpen={showStudyTimer}
        onOpenChange={setShowStudyTimer}
        onSessionComplete={(session: any) => {
          // Convert the session to match our StudySession interface
          const newSession: StudySession = {
            id: Date.now().toString(),
            subject: session.subjectName,
            duration: session.duration,
            date: new Date(session.date),
            notes: session.notes,
            sessionType: session.sessionType,
            productivity: session.productivity,
            topicsCovered: session.topicsCovered || [],
            materialsUsed: session.materialsUsed || []
          }
          
          setStudySessions(prev => [...prev, newSession])
          setShowStudyTimer(false)
          
          // Trigger real-time sync
          triggerUpdate("study-session-updated", { type: "created", session: newSession })
        }}
      />

      {/* Create Task Dialog */}
      <Dialog open={showCreateTask} onOpenChange={setShowCreateTask}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[500px] sm:max-h-[80vh] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Task Title *</Label>
              <Input
                id="title"
                placeholder="Enter task title..."
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter task description..."
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newTask.priority} onValueChange={(value: "low" | "medium" | "high") => setNewTask({...newTask, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Study, Assignment"
                  value={newTask.category}
                  onChange={(e) => setNewTask({...newTask, category: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <div className="relative">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left font-normal"
                    onClick={() => {
                      setDatePickerOpen(!datePickerOpen);
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newTask.dueDate ? format(newTask.dueDate, "PPP") : "Pick a date"}
                  </Button>
                  
                  {/* Enhanced date picker with month/year navigation */}
                  <ClientOnly fallback={null}>
                    {datePickerOpen && (
                      <div className="absolute z-50 mt-1 bg-popover border border-border rounded-md shadow-lg p-3 sm:p-4 w-72 sm:w-80">
                        {/* Month/Year Navigation */}
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <button
                            onClick={() => navigateMonth('prev')}
                            className="p-1.5 sm:p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                          >
                            <ChevronDown className="h-4 w-4 rotate-90" />
                          </button>
                          <div className="text-base sm:text-lg font-medium text-popover-foreground">
                            {getMonthName(currentMonth)} {currentYear}
                          </div>
                          <button
                            onClick={() => navigateMonth('next')}
                            className="p-1.5 sm:p-2 hover:bg-accent hover:text-accent-foreground rounded transition-colors"
                          >
                            <ChevronDown className="h-4 w-4 -rotate-90" />
                          </button>
                        </div>

                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="p-1.5 sm:p-2 text-xs text-muted-foreground text-center font-medium">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {/* Empty cells for days before the first day of month */}
                          {Array.from({length: getFirstDayOfMonth(currentMonth, currentYear)}, (_, i) => (
                            <div key={`empty-${i}`} className="p-1.5 sm:p-2"></div>
                          ))}
                          
                          {/* Date cells */}
                          {Array.from({length: getDaysInMonth(currentMonth, currentYear)}, (_, i) => {
                            const day = i + 1
                            const date = new Date(currentYear, currentMonth, day)
                            const isToday = date.toDateString() === new Date().toDateString()
                            const isSelected = newTask.dueDate && date.toDateString() === newTask.dueDate.toDateString()
                            const isPast = date < new Date() && !isToday
                            
                            return (
                              <button
                                key={day}
                                className={`p-1.5 sm:p-2 text-xs sm:text-sm rounded transition-colors ${
                                  isSelected 
                                    ? 'bg-primary text-primary-foreground' 
                                    : isToday 
                                      ? 'bg-accent text-accent-foreground font-medium' 
                                      : isPast
                                        ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                                        : 'hover:bg-accent hover:text-accent-foreground'
                                }`}
                                onClick={() => {
                                  if (isPast) return // Prevent selecting past dates
                                  console.log('Date selected:', date.toISOString());
                                  setNewTask({...newTask, dueDate: date});
                                  setDatePickerOpen(false);
                                }}
                                disabled={isPast}
                              >
                                {day}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </ClientOnly>
                </div>
                {/* Debug info */}
                <div className="text-xs text-muted-foreground mt-1">
                  Debug: {newTask.dueDate ? `Date set: ${newTask.dueDate.toString()}` : 'No date set'}
                </div>
              </div>
              <div>
                <Label htmlFor="estimatedTime">Estimated Time (min)</Label>
                <Input
                  id="estimatedTime"
                  type="number"
                  placeholder="30"
                  value={newTask.estimatedTime}
                  onChange={(e) => setNewTask({...newTask, estimatedTime: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateTask(false)}>
                Cancel
              </Button>
              <Button onClick={addTask} disabled={!newTask.title.trim()}>
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Study Session Dialog */}
      <Dialog open={showCreateStudySession} onOpenChange={setShowCreateStudySession}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto sm:max-w-[500px] sm:max-h-[80vh] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Log Study Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionSubject">Subject *</Label>
                <Select onValueChange={(value) => setNewStudySession({...newStudySession, subjectId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionType">Session Type *</Label>
                <Select onValueChange={(value) => setNewStudySession({...newStudySession, sessionType: value as "Focused Study" | "Review" | "Practice" | "Research" | "Group Study"})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Focused Study">Focused Study</SelectItem>
                    <SelectItem value="Review">Review</SelectItem>
                    <SelectItem value="Practice">Practice</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
                    <SelectItem value="Group Study">Group Study</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="sessionDate">Date</Label>
              <Input
                id="sessionDate"
                type="date"
                value={newStudySession.date}
                onChange={(e) => setNewStudySession({...newStudySession, date: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newStudySession.startTime}
                  onChange={(e) => setNewStudySession({...newStudySession, startTime: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newStudySession.endTime}
                  onChange={(e) => setNewStudySession({...newStudySession, endTime: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <div className="flex items-center h-10 px-3 rounded-md border bg-muted text-sm">
                  {calculateDuration(newStudySession.startTime, newStudySession.endTime) > 0 
                    ? `${Math.floor(calculateDuration(newStudySession.startTime, newStudySession.endTime) / 60)}h ${calculateDuration(newStudySession.startTime, newStudySession.endTime) % 60}m` 
                    : "0m"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Topics Covered</Label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  placeholder="Add topic (e.g., Derivatives, Newton's Laws)"
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTopic())}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={addTopic} className="sm:w-auto">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {topicsCovered.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {topicsCovered.map((topic, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {topic}
                      <button type="button" onClick={() => removeTopic(index)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Materials Used</Label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  placeholder="Add material (e.g., Textbook, Khan Academy)"
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addMaterial())}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={addMaterial} className="sm:w-auto">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {materialsUsed.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {materialsUsed.map((material, index) => (
                    <Badge key={index} variant="outline" className="flex items-center gap-1">
                      {material}
                      <button type="button" onClick={() => removeMaterial(index)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="productivity">Productivity Rating</Label>
              <Select
                value={newStudySession.productivity.toString()}
                onValueChange={(value) =>
                  setNewStudySession({ ...newStudySession, productivity: Number.parseInt(value) as 1 | 2 | 3 | 4 | 5 })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Very Low</SelectItem>
                  <SelectItem value="2">2 - Low</SelectItem>
                  <SelectItem value="3">3 - Average</SelectItem>
                  <SelectItem value="4">4 - Good</SelectItem>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sessionNotes">Notes (Optional)</Label>
              <Textarea
                id="sessionNotes"
                placeholder="Add notes about your session, what you learned, areas to improve..."
                value={newStudySession.notes}
                onChange={(e) => setNewStudySession({...newStudySession, notes: e.target.value})}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateStudySession(false)}>
                Cancel
              </Button>
              <Button 
                onClick={addStudySession} 
                disabled={!newStudySession.subjectId || !newStudySession.sessionType || !newStudySession.startTime || !newStudySession.endTime}
              >
                Log Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
