"use client"

import { useState, useMemo, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Clock, Target, BookOpen, Award, Download, ArrowLeft, HelpCircle } from "lucide-react"
import { startOfDay, startOfWeek, endOfWeek, addWeeks, startOfMonth, endOfMonth, addMonths } from "date-fns"
import { ThemeToggle } from "@/components/theme-toggle"
import { AdvancedAnalytics } from "@/components/analytics/advanced-analytics"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [timeRange, setTimeRange] = useState("month")
  const [selectedSubject, setSelectedSubject] = useState("all")
  const [newSubjectName, setNewSubjectName] = useState("")
  const [realData, setRealData] = useState<{
    studySessions: any[]
    testMarks: any[]
    subjects: any[]
    tasks: any[]
  }>({
    studySessions: [],
    testMarks: [],
    subjects: [],
    tasks: [],
  })

  // Helper function to safely access localStorage (client-side only)
  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(key)
      }
      return null
    },
    setItem: (key: string, value: string): void => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(key, value)
      }
    },
    removeItem: (key: string): void => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(key)
      }
    }
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

  // Function to create subjects dynamically from study sessions
  const createSubjectsFromSessions = (studySessions: any[], existingSubjects: any[]) => {
    // Don't auto-create subjects - let users add them manually
    return existingSubjects
  }

  // Function to manually add a new subject
  const addNewSubject = () => {
    if (!newSubjectName.trim()) return
    
    const trimmedName = newSubjectName.trim()
    if (trimmedName.length > 50) return
    
    // Check if subject already exists (case-insensitive)
    const existingNames = realData.subjects.map(s => s.name.toLowerCase())
    if (existingNames.includes(trimmedName.toLowerCase())) {
      setNewSubjectName("")
      return
    }
    
    const newSubject = {
      id: `subject-${Date.now()}`,
      name: trimmedName,
      description: `Study sessions for ${trimmedName}`,
      materials: [],
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      progress: 0,
      totalChapters: 0,
      completedChapters: 0,
      createdAt: new Date().toISOString()
    }
    
    const updatedSubjects = [...realData.subjects, newSubject]
    safeLocalStorage.setItem("subjects", JSON.stringify(updatedSubjects))
    
    setRealData(prev => ({
      ...prev,
      subjects: updatedSubjects
    }))
    
    setNewSubjectName("")
    
    // Dispatch custom event to trigger data updates
    window.dispatchEvent(new CustomEvent('subject-updated'))
  }

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    // Load real data from localStorage with error handling
    let studySessions: any[] = []
    let testMarks: any[] = []
    let subjects: any[] = []
    let tasks: any[] = []
    
    try {
      studySessions = JSON.parse(safeLocalStorage.getItem("studySessions") || "[]")
      // CRITICAL FIX: Convert study session dates to Date objects
      studySessions = studySessions.map((session: any) => ({
        ...session,
        date: new Date(session.date)
      }))
    } catch (error) {
      console.error('Failed to parse study sessions:', error)
      safeLocalStorage.removeItem("studySessions")
      studySessions = []
    }
    
    try {
      testMarks = JSON.parse(safeLocalStorage.getItem("testMarks") || "[]")
      // CRITICAL FIX: Convert test mark dates to Date objects
      testMarks = testMarks.map((mark: any) => ({
        ...mark,
        date: new Date(mark.date)
      }))
    } catch (error) {
      console.error('Failed to parse test marks:', error)
      safeLocalStorage.removeItem("testMarks")
      testMarks = []
    }
    
    // Debug test marks data
    if (process.env.NODE_ENV === 'development') {
      console.log('Test Marks Data Debug:', {
        testMarksCount: testMarks.length,
        testMarksSample: testMarks.slice(0, 3),
        testMarksStructure: testMarks.length > 0 ? Object.keys(testMarks[0]) : []
      })
    }
    
    try {
      subjects = JSON.parse(safeLocalStorage.getItem("subjects") || "[]")
      
      // Clean up any invalid or test subjects that might exist
      const invalidNames = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'sad', 'das', 'test', 'Test', '']
      const validSubjects = subjects.filter((subject: any) => {
        // Keep only subjects that have valid structure and non-invalid names
        return subject && 
               subject.name && 
               typeof subject.name === 'string' &&
               subject.name.trim().length > 0 &&
               !invalidNames.includes(subject.name.trim()) &&
               subject.name.length <= 50 // Reasonable name length limit
      })
      
      // If we filtered out invalid subjects, update localStorage
      if (validSubjects.length !== subjects.length) {
        subjects = validSubjects
        safeLocalStorage.setItem("subjects", JSON.stringify(subjects))
        console.log('Cleaned up invalid subjects from localStorage')
      }
      
      // Create subjects dynamically from study sessions
      subjects = createSubjectsFromSessions(studySessions, subjects)
      
      // Don't create default subjects - let users add them manually
      if (subjects.length === 0) {
        console.log('No subjects found - users should add subjects manually')
      }
      
      // Update localStorage if subjects were created
      safeLocalStorage.setItem("subjects", JSON.stringify(subjects))
    } catch (error) {
      console.error('Failed to parse subjects:', error)
      safeLocalStorage.removeItem("subjects")
      // Don't create default subjects on error
      subjects = []
      safeLocalStorage.setItem("subjects", JSON.stringify(subjects))
    }
    
    try {
      tasks = JSON.parse(safeLocalStorage.getItem("tasks") || "[]")
    } catch (error) {
      console.error('Failed to parse tasks:', error)
              safeLocalStorage.removeItem("tasks")
    }

    setRealData({
      studySessions,
      testMarks,
      subjects,
      tasks,
    })
  }, [router, status])

  // Set up real-time data updates
  useEffect(() => {
    const handleStorageChange = () => {
      // Reload data when localStorage changes
      let studySessions = JSON.parse(safeLocalStorage.getItem("studySessions") || "[]")
      // CRITICAL FIX: Convert study session dates to Date objects
      studySessions = studySessions.map((session: any) => ({
        ...session,
        date: new Date(session.date)
      }))
      let testMarks = JSON.parse(safeLocalStorage.getItem("testMarks") || "[]")
      // CRITICAL FIX: Convert test mark dates to Date objects
      testMarks = testMarks.map((mark: any) => ({
        ...mark,
        date: new Date(mark.date)
      }))
      let subjects = JSON.parse(safeLocalStorage.getItem("subjects") || "[]")
      let tasks = JSON.parse(safeLocalStorage.getItem("tasks") || "[]")
      
      // Debug data loading
      if (process.env.NODE_ENV === 'development') {
        console.log('Storage Change Handler - Data Loaded:', {
          studySessionsCount: studySessions.length,
          testMarksCount: testMarks.length,
          subjectsCount: subjects.length,
          tasksCount: tasks.length
        })
      }
      
      // Clean up any invalid or test subjects that might exist
      const invalidNames = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'sad', 'das', 'test', 'Test', '']
      const validSubjects = subjects.filter((subject: any) => {
        // Keep only subjects that have valid structure and non-invalid names
        return subject && 
               subject.name && 
               typeof subject.name === 'string' &&
               subject.name.trim().length > 0 &&
               !invalidNames.includes(subject.name.trim()) &&
               subject.name.length <= 50 // Reasonable name length limit
      })
      
      // If we filtered out invalid subjects, update localStorage
      if (validSubjects.length !== subjects.length) {
        subjects = validSubjects
        safeLocalStorage.setItem("subjects", JSON.stringify(subjects))
      }
      
      // Create subjects dynamically from study sessions
      subjects = createSubjectsFromSessions(studySessions, subjects)
      
      // Ensure at least one subject exists
      if (subjects.length === 0) {
        const defaultSubject = {
          id: 'general-studies',
          name: 'General Studies',
          color: '#0ea5e9',
          progress: 0
        }
        subjects = [defaultSubject]
      }
      
      // Update localStorage with any new subjects
              safeLocalStorage.setItem("subjects", JSON.stringify(subjects))
      
      setRealData({
        studySessions,
        testMarks,
        subjects,
        tasks,
      })
    }

    // Set up interval to check for data updates every 5 seconds
    const intervalId = setInterval(handleStorageChange, 5000)
    
    // Also listen for custom events from the dashboard
    const handleDataUpdate = () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Data update event received, refreshing data...')
      }
      handleStorageChange()
    }
    
    window.addEventListener('study-session-updated', handleDataUpdate)
    window.addEventListener('task-updated', handleDataUpdate)
    window.addEventListener('test-mark-updated', handleDataUpdate)
    window.addEventListener('subject-updated', handleDataUpdate)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('study-session-updated', handleDataUpdate)
      window.removeEventListener('task-updated', handleDataUpdate)
      window.removeEventListener('test-mark-updated', handleDataUpdate)
      window.removeEventListener('subject-updated', handleDataUpdate)
    }
  }, [])

  // One-time cleanup of old hardcoded data
  useEffect(() => {
    // Check if there are any old hardcoded subjects in localStorage and clear them
    try {
      const storedSubjects = JSON.parse(safeLocalStorage.getItem("subjects") || "[]")
      const hardcodedNames = ['Mathematics', 'Physics', 'Chemistry', 'Biology']
      const hasHardcodedSubjects = storedSubjects.some((subject: any) => hardcodedNames.includes(subject.name))
      
      // Clean up any invalid or test subjects
      const invalidNames = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'sad', 'das', 'test', 'Test', '']
      const hasInvalidSubjects = storedSubjects.some((subject: any) => 
        !subject || 
        !subject.name || 
        typeof subject.name !== 'string' ||
        subject.name.trim().length === 0 ||
        invalidNames.includes(subject.name.trim()) ||
        subject.name.length > 50
      )
      
      if (hasInvalidSubjects) {
        // Filter out invalid subjects
        const validSubjects = storedSubjects.filter((subject: any) => {
          return subject && 
                 subject.name && 
                 typeof subject.name === 'string' &&
                 subject.name.trim().length > 0 &&
                 !invalidNames.includes(subject.name.trim()) &&
                 subject.name.length <= 50
        })
        
        // If no valid subjects remain, don't create defaults
        const finalSubjects = validSubjects
        
        safeLocalStorage.setItem("subjects", JSON.stringify(finalSubjects))
        console.log('Cleaned up invalid subjects and set valid subjects')
        
        // Update the local state to reflect the change
        setRealData(prev => ({
          ...prev,
          subjects: finalSubjects
        }))
      }
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }, [])

  // Use real subjects from user data only - filter out any old hardcoded subjects
  let subjects = (realData.subjects || []).filter(subject => {
    // Filter out any old hardcoded subjects that might still exist
    const hardcodedNames = ['Mathematics', 'Physics', 'Chemistry', 'Biology']
    return !hardcodedNames.includes(subject.name)
  })
  
  // Don't ensure subjects exist - let users add them manually
  // Subjects array can be empty



  // Generate dynamic study time data from real sessions
  const studyTimeData = useMemo(() => {
    if (realData.studySessions.length === 0) return []
    
    const weeks = 4
    const data: any[] = []
    const today = startOfDay(new Date()) // Normalize today to start of day
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = startOfDay(new Date())
      weekStart.setDate(weekStart.getDate() - (i * 7))
      const weekEnd = startOfDay(new Date(weekStart))
      weekEnd.setDate(weekEnd.getDate() + 6)
      
      const weekSessions = realData.studySessions.filter((session: any) => {
        const sessionDate = startOfDay(new Date(session.date)) // Normalize session date to start of day
        return sessionDate >= weekStart && sessionDate <= weekEnd
      })
      
      const weekData: any = { date: `Week ${weeks - i}` }
      
      if (subjects.length > 0) {
        subjects.forEach(subject => {
          const subjectSessions = weekSessions.filter((s: any) => s.subject === subject.name)
          const totalHours = subjectSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0) / 60
          weekData[subject.name] = Math.round(totalHours * 10) / 10
        })
      } else {
        // If no subjects, show total study time
        const totalHours = weekSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0) / 60
        weekData.totalHours = Math.round(totalHours * 10) / 10
      }
      
      data.push(weekData)
    }
    
    return data
  }, [realData.studySessions, subjects])

  // Generate dynamic test scores data from real test marks
  const testScoresData = useMemo(() => {
    if (realData.testMarks.length === 0 || subjects.length === 0) return []
    
    // Debug logging to help identify issues
    if (process.env.NODE_ENV === 'development') {
      console.log('Test Scores Data Debug:', {
        testMarksCount: realData.testMarks.length,
        subjectsCount: subjects.length,
        testMarksSample: realData.testMarks.slice(0, 3).map(t => ({
          id: t.id,
          subjectName: t.subjectName,
          marksObtained: t.marksObtained,
          totalMarks: t.totalMarks,
          date: t.date
        })),
        subjectsSample: subjects.map(s => ({ name: s.name, id: s.id }))
      })
    }
    
    const months = 4
    const data: any[] = []
    const today = startOfDay(new Date()) // Normalize today to start of day
    
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = startOfMonth(addMonths(today, -i))
      const monthEnd = endOfMonth(addMonths(today, -i))
      
      const monthTests = realData.testMarks.filter((test: any) => {
        const testDate = startOfDay(new Date(test.date)) // Normalize test date to start of day
        return testDate >= monthStart && testDate < monthEnd
      })
      
      const monthData: any = { date: monthStart.toLocaleDateString('en-US', { month: 'short' }) }
      
      subjects.forEach(subject => {
        // CORRECTED: Use subjectName for filtering as per TestMark interface
        const subjectTests = monthTests.filter((t: any) => t.subjectName === subject.name)
        if (subjectTests.length > 0) {
          const avgScore = subjectTests.reduce((sum: number, t: any) => {
            // CORRECTED: Use marksObtained and totalMarks as per TestMark interface
            const score = t.marksObtained || 0
            const maxScore = t.totalMarks || 1
            return sum + (score / maxScore * 100)
          }, 0) / subjectTests.length
          monthData[subject.name] = Math.round(avgScore)
        } else {
          monthData[subject.name] = 0
        }
      })
      
      data.push(monthData)
    }
    
    return data
  }, [realData.testMarks, subjects])

  // Generate dynamic subject progress data from real sessions and chapter progress
  const subjectProgressData = useMemo(() => {
    if (subjects.length === 0) return []
    
    return subjects.map((subject) => {
      const subjectSessions = realData.studySessions.filter((s: any) => s.subject === subject.name)
      const studyTime = subjectSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)
      
      // Use actual chapter progress from subject data instead of tasks
      const progress = subject.progress || 0
      
      return {
        name: subject.name,
        completed: Math.round(progress),
        total: 100,
        color: subject.color || '#0ea5e9',
        studyTime: convertMinutesToHoursAndMinutes(studyTime),
        sessions: subjectSessions.length,
        // Remove task-related data - chapters are managed separately
        chapters: `${subject.completedChapters || 0}/${subject.totalChapters || 0}`
      }
    })
  }, [subjects, realData.studySessions, convertMinutesToHoursAndMinutes])

  // Generate dynamic goal achievement data from real data
  const goalAchievementData = useMemo(() => {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - today.getDay())
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    
    // Load user's actual study goals from settings or use defaults
    let dailyGoalMinutes = 2 * 60 // Default: 2 hours per day
    let weeklyGoalMinutes = 10 * 60 // Default: 10 hours per week
    let monthlyGoalMinutes = 40 * 60 // Default: 40 hours per month
    
    // Only access localStorage on the client side
    try {
      const savedSettings = safeLocalStorage.getItem("userSettings")
      console.log('Raw saved settings from localStorage:', savedSettings)
      if (savedSettings) {
        const userSettings = JSON.parse(savedSettings)
        console.log('Parsed user settings:', userSettings)
        if (userSettings.studyGoals) {
          console.log('Study goals found:', userSettings.studyGoals)
          dailyGoalMinutes = userSettings.studyGoals.dailyHours * 60
          
          // Check if autoCalculate is enabled
          if (userSettings.studyGoals.autoCalculate) {
            // Auto-calculate weekly and monthly from daily goal
            weeklyGoalMinutes = userSettings.studyGoals.dailyHours * 7 * 60  // daily × 7 days
            monthlyGoalMinutes = userSettings.studyGoals.dailyHours * 30 * 60 // daily × 30 days
            console.log('Auto-calculated goals:', {
              daily: userSettings.studyGoals.dailyHours,
              weekly: userSettings.studyGoals.dailyHours * 7,
              monthly: userSettings.studyGoals.dailyHours * 30
            })
          } else {
            // Use manual values
            weeklyGoalMinutes = userSettings.studyGoals.weeklyHours * 60
            monthlyGoalMinutes = userSettings.studyGoals.monthlyHours * 60
            console.log('Manual goals:', {
              daily: userSettings.studyGoals.dailyHours,
              weekly: userSettings.studyGoals.weeklyHours,
              monthly: userSettings.studyGoals.monthlyHours
            })
          }
          
          // Debug logging for goal settings
          if (process.env.NODE_ENV === 'development') {
            console.log('Goal Settings Debug:', {
              dailyHours: userSettings.studyGoals.dailyHours,
              weeklyHours: userSettings.studyGoals.autoCalculate ? userSettings.studyGoals.dailyHours * 7 : userSettings.studyGoals.weeklyHours,
              monthlyHours: userSettings.studyGoals.autoCalculate ? userSettings.studyGoals.dailyHours * 30 : userSettings.studyGoals.monthlyHours,
              autoCalculate: userSettings.studyGoals.autoCalculate,
              dailyGoalMinutes,
              weeklyGoalMinutes,
              monthlyGoalMinutes
            })
          }
        }
      } else {
        // Debug logging when no settings found
        if (process.env.NODE_ENV === 'development') {
          console.log('No user settings found, using defaults:', {
            dailyGoalMinutes,
            weeklyGoalMinutes,
            monthlyGoalMinutes
          })
        }
      }
    } catch (error) {
      console.error("Failed to parse user settings:", error)
    }
    
    // Daily goals - based on today's study sessions
    const todaySessions = realData.studySessions.filter((s: any) => {
      const sessionDate = new Date(s.date)
      return sessionDate.toDateString() === today.toDateString()
    })
    const dailyStudyTime = todaySessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)
    const dailyAchievement = Math.min(100, (dailyStudyTime / dailyGoalMinutes) * 100)
    
    // Weekly goals - based on this week's study sessions
    const weekSessions = realData.studySessions.filter((s: any) => {
      const sessionDate = new Date(s.date)
      return sessionDate >= weekStart && sessionDate <= today
    })
    const weeklyStudyTime = weekSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)
    const weeklyAchievement = Math.min(100, (weeklyStudyTime / weeklyGoalMinutes) * 100)
    
    // Monthly goals - based on this month's study sessions
    const monthSessions = realData.studySessions.filter((s: any) => {
      const sessionDate = new Date(s.date)
      return sessionDate >= monthStart && sessionDate <= today
    })
    const monthlyStudyTime = monthSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)
    const monthlyAchievement = Math.min(100, (monthlyStudyTime / monthlyGoalMinutes) * 100)
    
    // Debug logging for goal achievements
    if (process.env.NODE_ENV === 'development') {
      console.log('Goal Achievement Debug:', {
        dailyStudyTime,
        dailyGoalMinutes,
        dailyAchievement,
        weeklyStudyTime,
        weeklyGoalMinutes,
        weeklyAchievement,
        monthlyStudyTime,
        monthlyGoalMinutes,
        monthlyAchievement
      })
    }
    
    const result = [
      { 
        name: "Daily Goals", 
        achieved: Math.round(dailyAchievement), 
        total: 100,
        actual: dailyStudyTime,
        target: dailyGoalMinutes,
        unit: "minutes"
      },
      { 
        name: "Weekly Goals", 
        achieved: Math.round(weeklyAchievement), 
        total: 100,
        actual: weeklyStudyTime,
        target: weeklyGoalMinutes,
        unit: "minutes"
      },
      { 
        name: "Monthly Goals", 
        achieved: Math.round(monthlyAchievement), 
        total: 100,
        actual: monthlyStudyTime,
        target: monthlyGoalMinutes,
        unit: "minutes"
      },
    ]
    
    // Debug logging for final goal achievement data
    if (process.env.NODE_ENV === 'development') {
      console.log('Final Goal Achievement Data:', result)
    }
    
    return result
  }, [realData.studySessions])

  // Generate dynamic study distribution data from real sessions
  const studyDistribution = useMemo(() => {
    if (subjects.length === 0) {
      // If no subjects, group all sessions as "General Study"
      if (realData.studySessions.length > 0) {
        const totalStudyTime = realData.studySessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)
        return [{
          name: "General Study",
          value: Math.round(totalStudyTime / 60 * 10) / 10,
          color: "#0ea5e9",
          sessions: realData.studySessions.length,
          avgSessionLength: Math.round((totalStudyTime / realData.studySessions.length / 60) * 10) / 10
        }]
      }
      return []
    }
    
    return subjects.map((subject) => {
      const subjectSessions = realData.studySessions.filter((s: any) => s.subject === subject.name)
      const totalStudyTime = subjectSessions.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)
      
      return {
    name: subject.name,
        value: Math.round(totalStudyTime / 60 * 10) / 10,
        color: subject.color || '#0ea5e9',
        sessions: subjectSessions.length,
        avgSessionLength: subjectSessions.length > 0 
          ? Math.round((totalStudyTime / subjectSessions.length / 60) * 10) / 10 
          : 0
      }
    }).filter(subject => subject.value > 0) // Only show subjects with study time
  }, [subjects, realData.studySessions])

  // Calculate total study time from real data
  const totalStudyTime = useMemo(() => {
    return realData.studySessions.reduce((total: number, session: any) => {
      return total + (session.duration || 0)
    }, 0)
  }, [realData.studySessions])

  // Calculate average test score from real data
  const averageTestScore = useMemo(() => {
    if (realData.testMarks.length === 0) return 0
    
    // Debug logging for test marks
    if (process.env.NODE_ENV === 'development') {
      console.log('Test Marks Debug:', {
        testMarksCount: realData.testMarks.length,
        testMarksSample: realData.testMarks.slice(0, 3).map(t => ({
          id: t.id,
          marksObtained: t.marksObtained,
          totalMarks: t.totalMarks,
          percentage: t.percentage,
          subjectName: t.subjectName
        }))
      })
    }
    
    const totalScore = realData.testMarks.reduce((sum: number, test: any) => {
      // Use percentage if available, otherwise calculate from marks
      if (test.percentage !== undefined && test.percentage !== null) {
        return sum + test.percentage
      } else {
        const marksObtained = test.marksObtained || 0
        const totalMarks = test.totalMarks || 1
        return sum + (marksObtained / totalMarks * 100)
      }
    }, 0)
    
    const result = Math.round(totalScore / realData.testMarks.length)
    
    // Debug logging for calculation
    if (process.env.NODE_ENV === 'development') {
      console.log('Average Test Score Calculation:', {
        totalScore,
        testMarksCount: realData.testMarks.length,
        averageTestScore: result
      })
    }
    
    return result
  }, [realData.testMarks])

  // Calculate completed and total chapters from real data
  const completedTopics = useMemo(() => {
    return subjects.reduce((sum, subject) => sum + (subject.completedChapters || 0), 0)
  }, [subjects])

  const totalTopics = useMemo(() => {
    return subjects.reduce((sum, subject) => sum + (subject.totalChapters || 0), 0)
  }, [subjects])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="text-lg sm:text-xl font-bold text-foreground">Analytics</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Advanced Analytics Component */}
        <AdvancedAnalytics data={realData} />
        
        {/* Original Analytics Content */}
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Progress Analytics</h1>
            <p className="text-muted-foreground">Track your academic progress and performance</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Subject Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Subject Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {subjects.length > 0 ? (
                  subjects.map((subject) => (
                    <Badge
                      key={subject.id}
                      variant="outline"
                      className="px-3 py-1"
                      style={{ borderColor: subject.color, color: subject.color }}
                    >
                      {subject.name}
                    </Badge>
                  ))
                ) : (
                  <div className="text-center w-full py-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">No subjects added yet</p>
                    <p className="text-xs text-muted-foreground">
                      Add subjects to organize your study sessions and get detailed analytics
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Add new subject (e.g., Mathematics, Physics)"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addNewSubject()}
                  className="flex-1"
                  maxLength={50}
                />
                <Button
                  onClick={addNewSubject}
                  disabled={!newSubjectName.trim()}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                💡 Subjects help organize your study sessions and provide detailed analytics. 
                Start by adding your main study subjects (e.g., Mathematics, Physics, Chemistry).
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        {realData.studySessions.length === 0 && realData.tasks.length === 0 && realData.testMarks.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
              <p className="text-muted-foreground mb-4">
                Start studying and creating tasks to see your analytics here.
                {subjects.length === 0 && (
                  <span className="block mt-2 text-sm">
                    💡 Add subjects to get detailed analytics and better organization of your study data.
                  </span>
                )}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/dashboard">
                  <Button>
                    Go to Dashboard
                  </Button>
                </Link>
                {subjects.length === 0 && (
                  <Link href="/subjects">
                                          <Button variant="outline">
                        Add Your First Subject
                      </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Subjects Warning (when there's data but no subjects) */}
        {(realData.studySessions.length > 0 || realData.tasks.length > 0 || realData.testMarks.length > 0) && subjects.length === 0 && (
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-600 dark:text-blue-400">
                  🎯
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200">
                    Ready to Organize Your Studies?
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    You have study data! Adding subjects will help you organize your sessions and get detailed analytics. 
                    Create subjects like "Mathematics", "Physics", or "Literature" to start organizing your studies.
                  </p>
                  <div className="mt-3">
                    <Link href="/subjects">
                      <Button variant="outline" size="sm" className="border-blue-300 text-blue-800 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-200 dark:hover:bg-blue-800/20">
                        Add Your First Subject
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Study Hours</p>
                  <p className="text-2xl font-bold">{convertMinutesToHoursAndMinutes(totalStudyTime)}</p>
                </div>
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {realData.studySessions.length > 0 ? `${realData.studySessions.length} sessions` : 'No sessions yet'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Test Score</p>
                  <p className="text-2xl font-bold">{averageTestScore}%</p>
                </div>
                <Award className="h-8 w-8 text-accent" />
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {realData.testMarks.length > 0 ? `${realData.testMarks.length} tests taken` : 'No tests yet'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Chapters Completed</p>
                  <p className="text-2xl font-bold">
                    {completedTopics}/{totalTopics}
                  </p>
                </div>
                <BookOpen className="h-8 w-8 text-chart-1" />
              </div>
              <div className="mt-2">
                <Progress value={totalTopics > 0 ? (completedTopics / totalTopics) * 100 : 0} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {completedTopics} of {totalTopics} chapters completed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-muted-foreground">Goal Achievement</p>
                    <div className="relative group">
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        Calculated based on study time goals from your settings and actual study sessions completed
                      </div>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">
                    {goalAchievementData.length > 0 ? Math.round(goalAchievementData.reduce((sum, goal) => sum + goal.achieved, 0) / goalAchievementData.length) : 0}%
                  </p>
                </div>
                <Target className="h-8 w-8 text-chart-2" />
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {goalAchievementData.length > 0 && goalAchievementData.reduce((sum, goal) => sum + goal.achieved, 0) / goalAchievementData.length >= 80 ? 'On track' : 'Needs improvement'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        {realData.studySessions.length > 0 || realData.tasks.length > 0 || realData.testMarks.length > 0 ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="study-time">Study Time</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subject Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Subject Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  {subjectProgressData.length > 0 ? (
                  <div className="space-y-4">
                    {subjectProgressData.map((subject) => (
                      <div key={subject.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">{subject.name}</span>
                          <span className="text-sm text-muted-foreground">
                              {subject.completed}% complete
                          </span>
                          </div>
                          <Progress value={subject.completed} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{subject.sessions} sessions</span>
                            <span>{subject.studyTime} studied</span>
                            <span>{subject.chapters} chapters</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                      <div className="text-center">
                        <BookOpen className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">No subjects added yet</p>
                        <p className="text-xs mt-1">Add subjects to see detailed progress</p>
                      </div>
                  </div>
                  )}
                </CardContent>
              </Card>

              {/* Study Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Study Time Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    {studyDistribution.length > 0 ? (
                    <PieChart>
                      <Pie
                        data={studyDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {studyDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                        <Tooltip 
                          formatter={(value: any, name: any) => [
                            `${value}h (${Math.round((value / studyDistribution.reduce((sum: number, item: any) => sum + item.value, 0)) * 100)}%)`,
                            name
                          ]}
                        />
                      <Legend />
                    </PieChart>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <Clock className="h-12 w-12 mx-auto mb-2" />
                          <p>No study time data available</p>
                        </div>
                      </div>
                    )}
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="study-time" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Study Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    {studyTimeData.length > 0 ? (
                  <BarChart data={studyTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                        {subjects.length > 0 ? subjects.map((subject) => (
                          <Bar 
                            key={subject.name}
                            dataKey={subject.name} 
                            fill={subject.color} 
                          />
                        )) : (
                          <Bar dataKey="totalHours" fill="#0ea5e9" />
                        )}
                  </BarChart>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <BookOpen className="h-12 w-12 mx-auto mb-2" />
                          <p>No study data available for this period</p>
                        </div>
                      </div>
                    )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Score Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    {testScoresData.length > 0 ? (
                  <LineChart data={testScoresData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                        {subjects.length > 0 ? subjects.map((subject) => (
                          <Line 
                            key={subject.name}
                            type="monotone" 
                            dataKey={subject.name} 
                            stroke={subject.color} 
                            strokeWidth={2} 
                          />
                        )) : (
                          <Line 
                            type="monotone" 
                            dataKey="averageScore" 
                            stroke="#0ea5e9" 
                            strokeWidth={2} 
                          />
                        )}
                  </LineChart>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center">
                          <Award className="h-12 w-12 mx-auto mb-2" />
                          <p>No test data available for this period</p>
                        </div>
                      </div>
                    )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {goalAchievementData.map((goal) => (
                <Card key={goal.name}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{goal.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">{goal.achieved}%</span>
                        <Badge variant={goal.achieved >= 80 ? "default" : "secondary"}>
                          {goal.achieved >= 80 ? "Excellent" : "Needs Improvement"}
                        </Badge>
                      </div>
                      <Progress value={goal.achieved} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {convertMinutesToHoursAndMinutes(goal.actual)}/{convertMinutesToHoursAndMinutes(goal.target)} achieved
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        ) : null}
      </div>
    </div>
  )
}
