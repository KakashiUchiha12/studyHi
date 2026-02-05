"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookMarked, Users, TrendingUp, PlusCircle, Edit, BarChart3, RefreshCw, ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function InstructorHub() {
  const { data: userAuth, status } = useSession()
  const routerNav = useRouter()
  const [myCourses, setMyCourses] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, published: 0, students: 0 })
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    status === "unauthenticated" && routerNav.push("/auth/login")
  }, [status, routerNav])

  useEffect(() => {
    status === "authenticated" && loadInstructorData()
  }, [status])

  const loadInstructorData = async () => {
    try {
      const userId = (userAuth?.user as any)?.id
      const coursesResponse = await fetch(`/api/courses?instructorId=${userId}`)
      const coursesData = await coursesResponse.json()
      
      if (coursesResponse.ok) {
        const coursesList = coursesData.courses || []
        setMyCourses(coursesList)
        
        const totalStudents = coursesList.reduce(
          (sum: number, c: any) => sum + (c.enrollmentCount || 0), 0
        )
        const publishedCount = coursesList.filter((c: any) => c.status === "published").length
        
        setStats({
          total: coursesList.length,
          published: publishedCount,
          students: totalStudents
        })
      }
    } catch (err) {
      console.error("Loading failed:", err)
    } finally {
      setLoadingData(false)
    }
  }

  if (status === "loading" || loadingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading instructor dashboard...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="border-b bg-card/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-5">
              <Link href="/courses">
                <Button variant="ghost" className="gap-2">
                  <ChevronLeft className="h-4 w-4" />
                  Courses
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your courses and track performance
                </p>
              </div>
            </div>
            <Link href="/courses/instructor/create">
              <Button size="lg" className="gap-2">
                <PlusCircle className="h-5 w-5" />
                Create Course
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Courses
              </CardTitle>
              <BookMarked className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.published} published
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Students
              </CardTitle>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.students}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Across all courses
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Avg. Rating
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {myCourses.length > 0
                  ? (myCourses.reduce((sum, c) => sum + c.averageRating, 0) / myCourses.length).toFixed(1)
                  : "0.0"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Overall performance
              </p>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">Your Courses</h2>
          
          {myCourses.length === 0 ? (
            <Card className="text-center py-16 border-dashed border-2">
              <CardContent>
                <BookMarked className="h-16 w-16 mx-auto text-muted-foreground/40 mb-6" />
                <h3 className="text-2xl font-semibold mb-3">No Courses Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start sharing your knowledge by creating your first course
                </p>
                <Link href="/courses/instructor/create">
                  <Button size="lg" className="gap-2">
                    <PlusCircle className="h-5 w-5" />
                    Create Your First Course
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {myCourses.map((course) => (
                <Card key={course.id} className="group hover:shadow-xl transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <CardTitle className="text-lg line-clamp-2 flex-1">
                        {course.title}
                      </CardTitle>
                      <Badge variant={course.status === "published" ? "default" : "secondary"}>
                        {course.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.shortDescription || "No description"}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">{course.enrollmentCount}</p>
                        <p className="text-xs text-muted-foreground">Students</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">{course.averageRating.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground">Rating</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-primary">{course.ratingCount}</p>
                        <p className="text-xs text-muted-foreground">Reviews</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/courses/instructor/${course.id}/edit`} className="flex-1">
                        <Button variant="outline" className="w-full gap-2">
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/courses/instructor/${course.id}/analytics`} className="flex-1">
                        <Button variant="outline" className="w-full gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Stats
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
