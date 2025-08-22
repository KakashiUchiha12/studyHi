"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Search, Plus, ArrowLeft, TrendingUp, TrendingDown, Minus, Edit, Trash2, AlertTriangle, BookOpen, Eye, EyeOff } from "lucide-react"
import { AddTestDialog } from "@/components/test-marks/add-test-dialog"
import { EditTestDialog } from "@/components/test-marks/edit-test-dialog"
import { DeleteTestDialog } from "@/components/test-marks/delete-test-dialog"
import { TestPerformanceChart } from "@/components/test-marks/test-performance-chart"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

interface Mistake {
  id: string
  question: string
  correctAnswer: string
  yourAnswer: string
  explanation?: string
  topic?: string
  difficulty: "Easy" | "Medium" | "Hard"
}

interface TestMark {
  id: string
  testName: string
  subjectId: string
  subjectName: string
  date: string
  marksObtained: number
  totalMarks: number
  percentage: number
  grade: string
  comments?: string
  testType: "Quiz" | "Midterm" | "Final" | "Assignment" | "Project"
  mistakes?: Mistake[]
  createdAt: string
}

interface Subject {
  id: string
  name: string
  color: string
}

export default function TestMarksPage() {
  const [testMarks, setTestMarks] = useState<TestMark[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState<string>("all")
  const [selectedTestType, setSelectedTestType] = useState<string>("all")
  const [selectedTest, setSelectedTest] = useState<TestMark | null>(null)
  const [expandedMistakes, setExpandedMistakes] = useState<Set<string>>(new Set())
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
    // Check authentication
    const userData = localStorage.getItem("user")
    if (!userData) {
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
        // Clear corrupted data and start fresh
        localStorage.removeItem("subjects")
        setSubjects([])
      }
    }

    // Load test marks from localStorage or initialize with sample data
    const savedTestMarks = localStorage.getItem("testMarks")
    if (savedTestMarks) {
      try {
        setTestMarks(JSON.parse(savedTestMarks))
      } catch (error) {
        console.error('Failed to parse saved test marks:', error)
        // Clear corrupted data and initialize with sample data
        localStorage.removeItem("testMarks")
        initializeSampleTestMarks()
      }
    } else {
      initializeSampleTestMarks()
    }
  }, [router])

  const initializeSampleTestMarks = () => {
    // Initialize with sample test marks
    const sampleTestMarks: TestMark[] = [
      {
        id: "1",
        testName: "Calculus Quiz 1",
        subjectId: "1",
        subjectName: "Mathematics",
        date: "2024-01-15",
        marksObtained: 85,
        totalMarks: 100,
        percentage: 85,
        grade: "A",
        comments: "Good understanding of derivatives",
        testType: "Quiz",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        testName: "Midterm Exam",
        subjectId: "1",
        subjectName: "Mathematics",
        date: "2024-01-28",
        marksObtained: 92,
        totalMarks: 100,
        percentage: 92,
        grade: "A+",
        comments: "Excellent performance on integration problems",
        testType: "Midterm",
        createdAt: new Date().toISOString(),
      },
      {
        id: "3",
        testName: "Mechanics Test",
        subjectId: "2",
        subjectName: "Physics",
        date: "2024-01-20",
        marksObtained: 78,
        totalMarks: 100,
        percentage: 78,
        grade: "B+",
        comments: "Need to work on problem-solving speed",
        testType: "Quiz",
        createdAt: new Date().toISOString(),
      },
      {
        id: "4",
        testName: "Organic Chemistry Lab",
        subjectId: "3",
        subjectName: "Chemistry",
        date: "2024-02-01",
        marksObtained: 95,
        totalMarks: 100,
        percentage: 95,
        grade: "A+",
        comments: "Perfect lab technique and analysis",
        testType: "Assignment",
        createdAt: new Date().toISOString(),
      },
      {
        id: "5",
        testName: "Physics Final",
        subjectId: "2",
        subjectName: "Physics",
        date: "2024-02-10",
        marksObtained: 88,
        totalMarks: 100,
        percentage: 88,
        grade: "A",
        testType: "Final",
        createdAt: new Date().toISOString(),
      },
    ]
    setTestMarks(sampleTestMarks)
    localStorage.setItem("testMarks", JSON.stringify(sampleTestMarks))
  }

  const getGrade = (percentage: number): string => {
    if (percentage >= 97) return "A+"
    if (percentage >= 93) return "A"
    if (percentage >= 90) return "A-"
    if (percentage >= 87) return "B+"
    if (percentage >= 83) return "B"
    if (percentage >= 80) return "B-"
    if (percentage >= 77) return "C+"
    if (percentage >= 73) return "C"
    if (percentage >= 70) return "C-"
    if (percentage >= 67) return "D+"
    if (percentage >= 65) return "D"
    return "F"
  }

  const filteredTestMarks = testMarks.filter((test) => {
    const matchesSearch =
      test.testName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSubject = selectedSubject === "all" || test.subjectId === selectedSubject
    const matchesTestType = selectedTestType === "all" || test.testType === selectedTestType
    return matchesSearch && matchesSubject && matchesTestType
  })

  const handleAddTest = (newTest: Omit<TestMark, "id" | "createdAt" | "percentage" | "grade">) => {
    const percentage = Math.round((newTest.marksObtained / newTest.totalMarks) * 100)
    const grade = getGrade(percentage)

    const testMark: TestMark = {
      ...newTest,
      id: Date.now().toString(),
      percentage,
      grade,
      createdAt: new Date().toISOString(),
    }

    const updatedTestMarks = [...testMarks, testMark]
    setTestMarks(updatedTestMarks)
    localStorage.setItem("testMarks", JSON.stringify(updatedTestMarks))
    setDialogState({ ...dialogState, add: false })
  }

  const handleEditTest = (updatedTest: TestMark) => {
    const percentage = Math.round((updatedTest.marksObtained / updatedTest.totalMarks) * 100)
    const grade = getGrade(percentage)

    const finalTest = {
      ...updatedTest,
      percentage,
      grade,
    }

    const updatedTestMarks = testMarks.map((test) => (test.id === finalTest.id ? finalTest : test))
    setTestMarks(updatedTestMarks)
    localStorage.setItem("testMarks", JSON.stringify(updatedTestMarks))
    setDialogState({ ...dialogState, edit: false })
    setSelectedTest(null)
  }

  const handleDeleteTest = (testId: string) => {
    const updatedTestMarks = testMarks.filter((test) => test.id !== testId)
    setTestMarks(updatedTestMarks)
    localStorage.setItem("testMarks", JSON.stringify(updatedTestMarks))
    setDialogState({ ...dialogState, delete: false })
    setSelectedTest(null)
  }

  // Calculate statistics
  const stats = {
    totalTests: filteredTestMarks.length,
    averageScore:
      filteredTestMarks.length > 0
        ? Math.round(filteredTestMarks.reduce((sum, test) => sum + test.percentage, 0) / filteredTestMarks.length)
        : 0,
    highestScore: filteredTestMarks.length > 0 ? Math.max(...filteredTestMarks.map((test) => test.percentage)) : 0,
    lowestScore: filteredTestMarks.length > 0 ? Math.min(...filteredTestMarks.map((test) => test.percentage)) : 0,
  }

  const getGradeColor = (grade: string) => {
    if (grade.startsWith("A")) return "text-accent"
    if (grade.startsWith("B")) return "text-primary"
    if (grade.startsWith("C")) return "text-chart-1"
    if (grade.startsWith("D")) return "text-chart-2"
    return "text-destructive"
  }

  const getPerformanceTrend = () => {
    if (filteredTestMarks.length < 2) return null
    const recent = filteredTestMarks.slice(-2)
    const trend = recent[1].percentage - recent[0].percentage
    if (trend > 0) return { icon: TrendingUp, color: "text-accent", text: `+${trend}%` }
    if (trend < 0) return { icon: TrendingDown, color: "text-destructive", text: `${trend}%` }
    return { icon: Minus, color: "text-muted-foreground", text: "No change" }
  }

  const trend = getPerformanceTrend()

  const toggleMistakes = (testId: string) => {
    const newExpanded = new Set(expandedMistakes)
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId)
    } else {
      newExpanded.add(testId)
    }
    setExpandedMistakes(newExpanded)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "text-green-600 bg-green-50 dark:bg-green-950/20"
      case "Medium": return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20"
      case "Hard": return "text-red-600 bg-red-50 dark:bg-red-950/20"
      default: return "text-gray-600 bg-gray-50 dark:bg-gray-950/20"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold text-foreground">Test Marks</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Button onClick={() => setDialogState({ ...dialogState, add: true })}>
                <Plus className="h-4 w-4 mr-2" />
                Add Test Result
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Test Performance</h1>
          <p className="mt-2 text-muted-foreground">Track your test scores and monitor academic progress</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTests}</div>
              <p className="text-xs text-muted-foreground">Recorded tests</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageScore}%</div>
              {trend && (
                <div className={`flex items-center text-xs ${trend.color}`}>
                  <trend.icon className="h-3 w-3 mr-1" />
                  {trend.text}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.highestScore}%</div>
              <p className="text-xs text-muted-foreground">Best performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lowest Score</CardTitle>
              <TrendingDown className="h-4 w-4 text-chart-1" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-chart-1">{stats.lowestScore}%</div>
              <p className="text-xs text-muted-foreground">Needs improvement</p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        {filteredTestMarks.length > 0 && (
          <div className="mb-8">
            <TestPerformanceChart testMarks={filteredTestMarks} />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tests or subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
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
          <Select value={selectedTestType} onValueChange={setSelectedTestType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Quiz">Quiz</SelectItem>
              <SelectItem value="Midterm">Midterm</SelectItem>
              <SelectItem value="Final">Final</SelectItem>
              <SelectItem value="Assignment">Assignment</SelectItem>
              <SelectItem value="Project">Project</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Test Results */}
        {filteredTestMarks.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchQuery || selectedSubject !== "all" || selectedTestType !== "all"
                  ? "No tests found"
                  : "No test results yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedSubject !== "all" || selectedTestType !== "all"
                  ? "Try adjusting your filters"
                  : "Start tracking your academic performance by adding your first test result"}
              </p>
              {!searchQuery && selectedSubject === "all" && selectedTestType === "all" && (
                <Button onClick={() => setDialogState({ ...dialogState, add: true })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Test
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTestMarks
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((test) => (
                <Card key={test.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{test.testName}</h3>
                          <Badge variant="outline">{test.testType}</Badge>
                          <Badge variant="secondary">{test.subjectName}</Badge>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                          <span>Date: {new Date(test.date).toLocaleDateString()}</span>
                          <span>
                            Score: {test.marksObtained}/{test.totalMarks}
                          </span>
                          <span className={`font-medium ${getGradeColor(test.grade)}`}>
                            {test.percentage}% ({test.grade})
                          </span>
                        </div>
                        {test.comments && (
                          <p className="mt-2 text-sm text-muted-foreground italic">"{test.comments}"</p>
                        )}
                        {test.mistakes && test.mistakes.length > 0 && (
                          <div className="mt-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleMistakes(test.id)}
                              className="text-orange-600 hover:text-orange-700 p-0 h-auto"
                            >
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              {test.mistakes.length} mistake{test.mistakes.length !== 1 ? 's' : ''} recorded
                              {expandedMistakes.has(test.id) ? (
                                <EyeOff className="h-4 w-4 ml-2" />
                              ) : (
                                <Eye className="h-4 w-4 ml-2" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right mr-4">
                          <div className={`text-2xl font-bold ${getGradeColor(test.grade)}`}>{test.grade}</div>
                          <div className="text-sm text-muted-foreground">{test.percentage}%</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTest(test)
                            setDialogState({ ...dialogState, edit: true })
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTest(test)
                            setDialogState({ ...dialogState, delete: true })
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Mistakes Section */}
                    {test.mistakes && test.mistakes.length > 0 && expandedMistakes.has(test.id) && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Mistakes to Review
                        </h4>
                        <div className="space-y-3">
                          {test.mistakes.map((mistake, index) => (
                            <div key={mistake.id} className="bg-red-50 dark:bg-red-950/10 p-3 rounded-lg border border-red-200 dark:border-red-800">
                              <div className="flex items-start justify-between mb-2">
                                <span className="text-sm font-medium text-red-800 dark:text-red-200">
                                  Question {index + 1}
                                </span>
                                <div className="flex items-center gap-2">
                                  {mistake.topic && (
                                    <Badge variant="outline" className="text-xs">
                                      {mistake.topic}
                                    </Badge>
                                  )}
                                  <Badge className={`text-xs ${getDifficultyColor(mistake.difficulty)}`}>
                                    {mistake.difficulty}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-foreground mb-2 font-medium">{mistake.question}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                                <div className="bg-red-100 dark:bg-red-900/20 p-2 rounded">
                                  <span className="text-xs font-medium text-red-700 dark:text-red-300">Your Answer:</span>
                                  <p className="text-sm text-red-800 dark:text-red-200">{mistake.yourAnswer}</p>
                                </div>
                                <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded">
                                  <span className="text-xs font-medium text-green-700 dark:text-green-300">Correct Answer:</span>
                                  <p className="text-sm text-green-800 dark:text-green-200">{mistake.correctAnswer}</p>
                                </div>
                              </div>
                              {mistake.explanation && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Explanation:</span>
                                  <p className="text-sm text-blue-800 dark:text-blue-200">{mistake.explanation}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </main>

      {/* Dialogs */}
      <AddTestDialog
        open={dialogState.add}
        onOpenChange={(open) => setDialogState({ ...dialogState, add: open })}
        subjects={subjects}
        onAddTest={handleAddTest}
      />

      {selectedTest && (
        <>
          <EditTestDialog
            open={dialogState.edit}
            onOpenChange={(open) => setDialogState({ ...dialogState, edit: open })}
            test={selectedTest}
            subjects={subjects}
            onEditTest={handleEditTest}
          />

          <DeleteTestDialog
            open={dialogState.delete}
            onOpenChange={(open) => setDialogState({ ...dialogState, delete: open })}
            test={selectedTest}
            onDeleteTest={handleDeleteTest}
          />
        </>
      )}
    </div>
  )
}
