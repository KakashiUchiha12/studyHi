"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LibraryBig, Play, Award, Calendar, ChevronLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface StudentEnrollment {
  id: string
  progress: number
  lastAccessedAt: string
  enrolledAt: string
  course: {
    id: string
    title: string
    slug: string
    courseImage?: string
    category: string
    instructor: { name: string }
    modules: Array<{ chapters: any[] }>
  }
}

export default function StudentDashboardPage() {
  const { data: authInfo, status: authState } = useSession()
  const navigationRouter = useRouter()
  const [myEnrollments, setMyEnrollments] = useState<StudentEnrollment[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState("all")

  useEffect(() => {
    authState === "unauthenticated" && navigationRouter.push("/auth/login")
  }, [authState, navigationRouter])

  useEffect(() => {
    authState === "authenticated" && loadMyEnrollments()
  }, [authState])

  const loadMyEnrollments = async () => {
    try {
      const apiCall = await fetch("/api/courses?enrolled=true")
      const resultData = await apiCall.json()
      apiCall.ok && resultData.enrollments && setMyEnrollments(resultData.enrollments)
    } catch (err) {
      console.error("Loading enrollments failed:", err)
    } finally {
      setIsLoadingData(false)
    }
  }

  const getFilteredList = () => {
    if (selectedFilter === "ongoing") 
      return myEnrollments.filter(e => e.progress > 0 && e.progress < 100)
    if (selectedFilter === "finished") 
      return myEnrollments.filter(e => e.progress === 100)
    return myEnrollments
  }

  const countLessons = (moduleList: any[]) => {
    return moduleList.reduce((total, m) => total + (m.chapters?.length || 0), 0)
  }

  const formatAccessDate = (dateStr: string) => {
    const dateObj = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    return `${diffDays} days ago`
  }

  if (authState === "loading" || isLoadingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading your courses...</p>
      </div>
    )
  }

  const filteredItems = getFilteredList()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="border-b bg-card/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <Link href="/courses">
                <Button variant="ghost" className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Explore
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <LibraryBig className="h-7 w-7 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Learning Dashboard</h1>
                  <p className="text-sm text-muted-foreground">
                    {myEnrollments.length} enrolled courses
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="space-y-8">
          <TabsList className="grid w-full max-w-xl grid-cols-3 h-12">
            <TabsTrigger value="all" className="text-base">
              All ({myEnrollments.length})
            </TabsTrigger>
            <TabsTrigger value="ongoing" className="text-base">
              Ongoing ({myEnrollments.filter(e => e.progress > 0 && e.progress < 100).length})
            </TabsTrigger>
            <TabsTrigger value="finished" className="text-base">
              Finished ({myEnrollments.filter(e => e.progress === 100).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedFilter} className="mt-0">
            {filteredItems.length === 0 ? (
              <Card className="text-center py-16 border-dashed border-2">
                <CardContent className="pt-6">
                  <LibraryBig className="h-16 w-16 mx-auto text-muted-foreground/40 mb-6" />
                  <h3 className="text-2xl font-semibold mb-3">
                    {selectedFilter === "all" ? "No Enrollments" : `No ${selectedFilter} courses`}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {selectedFilter === "all"
                      ? "Browse our catalog and enroll in courses to start your learning journey"
                      : "Keep working on your enrolled courses"}
                  </p>
                  <Link href="/courses">
                    <Button size="lg">Discover Courses</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((enrollment) => {
                  const lessonCount = countLessons(enrollment.course.modules)
                  const completedCount = Math.round((enrollment.progress / 100) * lessonCount)
                  const isCompleted = enrollment.progress === 100
                  
                  return (
                    <Card key={enrollment.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-2">
                      <div className="relative aspect-video bg-gradient-to-tr from-violet-100 via-fuchsia-100 to-pink-100 dark:from-violet-950 dark:via-fuchsia-950 dark:to-pink-950">
                        {enrollment.course.courseImage ? (
                          <Image
                            src={enrollment.course.courseImage}
                            alt={enrollment.course.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <LibraryBig className="h-20 w-20 text-violet-300 dark:text-violet-700 opacity-50" />
                          </div>
                        )}
                        {isCompleted && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 gap-1">
                              <Award className="h-3.5 w-3.5" />
                              Completed
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <CardHeader className="space-y-3">
                        <Badge variant="outline" className="w-fit text-xs">
                          {enrollment.course.category}
                        </Badge>
                        <CardTitle className="text-lg line-clamp-2 leading-snug">
                          {enrollment.course.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          {enrollment.course.instructor.name}
                        </p>
                      </CardHeader>
                      
                      <CardContent className="space-y-5">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-sm font-medium">
                            <span className="text-muted-foreground">Completion</span>
                            <span className="text-foreground">{Math.round(enrollment.progress)}%</span>
                          </div>
                          <Progress value={enrollment.progress} className="h-2.5" />
                          <p className="text-xs text-muted-foreground">
                            {completedCount} / {lessonCount} lessons completed
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Active {formatAccessDate(enrollment.lastAccessedAt)}</span>
                        </div>

                        <Link href={`/courses/${enrollment.course.slug}/learn/${enrollment.course.modules[0]?.chapters[0]?.id || ""}`}>
                          <Button className="w-full gap-2" size="lg">
                            {enrollment.progress > 0 ? (
                              <>
                                <Play className="h-4 w-4" />
                                Resume Learning
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4" />
                                Begin Course
                              </>
                            )}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
