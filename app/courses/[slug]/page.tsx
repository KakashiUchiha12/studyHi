"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import EnrollButton from "@/components/courses/EnrollButton"
import ReviewsList from "@/components/courses/ReviewsList"
import ReviewForm from "@/components/courses/ReviewForm"
import { 
  GraduationCap, UsersRound, StarIcon, TimerIcon, LanguagesIcon, 
  CircleCheckBig, Video, RefreshCw, ChevronLeft, Trophy 
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function CourseDetailsView() {
  const routeParams = useParams()
  const nav = useRouter()
  const { data: sessionData } = useSession()
  const [courseInfo, setCourseInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isStudentEnrolled, setIsStudentEnrolled] = useState(false)
  const [initialChapter, setInitialChapter] = useState<string>("")

  useEffect(() => {
    routeParams.slug && fetchCourseData()
  }, [routeParams.slug, sessionData])

  const fetchCourseData = async () => {
    try {
      const endpoint = `/api/courses?slug=${routeParams.slug}`
      const serverResponse = await fetch(endpoint)
      const jsonPayload = await serverResponse.json()
      
      if (serverResponse.ok && jsonPayload.courses?.[0]) {
        const fetchedCourse = jsonPayload.courses[0]
        setCourseInfo(fetchedCourse)
        
        fetchedCourse.modules?.[0]?.chapters?.[0] && 
          setInitialChapter(fetchedCourse.modules[0].chapters[0].id)

        sessionData?.user && verifyEnrollment(fetchedCourse.id)
      }
    } catch (problem) {
      console.error("Course fetch error:", problem)
    } finally {
      setLoading(false)
    }
  }

  const verifyEnrollment = async (courseIdentifier: string) => {
    try {
      const checkResponse = await fetch(`/api/courses/${courseIdentifier}`)
      const checkData = await checkResponse.json()
      setIsStudentEnrolled(checkData.isEnrolled || false)
    } catch (problem) {
      console.error("Enrollment check error:", problem)
    }
  }

  const onSuccessfulEnrollment = () => {
    setIsStudentEnrolled(true)
    fetchCourseData()
  }

  const getTotalChapterCount = () => {
    if (!courseInfo?.modules) return 0
    return courseInfo.modules.reduce(
      (sum: number, mod: any) => sum + (mod.chapters?.length || 0), 0
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading course information...</p>
      </div>
    )
  }

  if (!courseInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Course Not Available</h2>
          <p className="text-muted-foreground">The requested course could not be found.</p>
          <Link href="/courses">
            <Button size="lg">Return to Catalog</Button>
          </Link>
        </div>
      </div>
    )
  }

  const chapterTotal = getTotalChapterCount()
  const teacherData = courseInfo.instructor
  const objectives = courseInfo.learningObjectives 
    ? JSON.parse(courseInfo.learningObjectives) 
    : []
  const requiredKnowledge = courseInfo.requirements
    ? JSON.parse(courseInfo.requirements)
    : []

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-10">
          <Link href="/courses">
            <Button variant="ghost" className="text-white hover:bg-white/20 mb-6 gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to catalog
            </Button>
          </Link>

          <div className="grid lg:grid-cols-[2fr_1fr] gap-10">
            <div className="space-y-5">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" className="bg-white/25 text-white backdrop-blur">
                  {courseInfo.category}
                </Badge>
                <Badge variant="secondary" className="bg-white/25 text-white backdrop-blur">
                  {courseInfo.difficulty}
                </Badge>
              </div>

              <h1 className="text-5xl font-extrabold tracking-tight">{courseInfo.title}</h1>
              <p className="text-xl text-white/95 leading-relaxed">{courseInfo.shortDescription}</p>

              <div className="flex items-center gap-8 flex-wrap pt-2">
                <div className="flex items-center gap-2.5">
                  <StarIcon className="h-6 w-6 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-lg">{courseInfo.averageRating.toFixed(1)}</span>
                  <span className="text-white/85 text-sm">({courseInfo.ratingCount} reviews)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <UsersRound className="h-6 w-6" />
                  <span className="font-medium">{courseInfo.enrollmentCount} learners</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <TimerIcon className="h-6 w-6" />
                  <span className="font-medium">{chapterTotal} lessons</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <LanguagesIcon className="h-6 w-6" />
                  <span className="font-medium uppercase">{courseInfo.language}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-3">
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold text-xl shadow-lg">
                  {teacherData.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-white/80">Taught by</p>
                  <p className="font-semibold text-lg">{teacherData.name}</p>
                </div>
              </div>
            </div>

            <div>
              <Card className="shadow-2xl">
                {courseInfo.courseImage ? (
                  <div className="relative aspect-video">
                    <Image
                      src={courseInfo.courseImage}
                      alt={courseInfo.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-tr from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 flex items-center justify-center rounded-t-lg">
                    <GraduationCap className="h-24 w-24 text-indigo-300 dark:text-indigo-700" />
                  </div>
                )}
                <div className="p-7 space-y-5">
                  <div className="text-center">
                    <p className="text-4xl font-extrabold text-primary">
                      {courseInfo.isPaid 
                        ? `${courseInfo.currency} ${courseInfo.price.toFixed(2)}` 
                        : "Free Course"}
                    </p>
                  </div>

                  {isStudentEnrolled ? (
                    <Link href={`/courses/${courseInfo.slug}/learn/${initialChapter}`}>
                      <Button className="w-full gap-2" size="lg">
                        <Video className="h-5 w-5" />
                        Access Course
                      </Button>
                    </Link>
                  ) : (
                    <EnrollButton
                      courseId={courseInfo.id}
                      isPaid={courseInfo.isPaid}
                      price={courseInfo.price}
                      currency={courseInfo.currency}
                      onEnrollSuccess={onSuccessfulEnrollment}
                    />
                  )}

                  <div className="space-y-3 text-sm border-t pt-5">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Level</span>
                      <span className="font-semibold capitalize">{courseInfo.difficulty}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Language</span>
                      <span className="font-semibold uppercase">{courseInfo.language}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Enrolled</span>
                      <span className="font-semibold">{courseInfo.enrollmentCount}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14">
        <Tabs defaultValue="info" className="space-y-8">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 h-14 p-1">
            <TabsTrigger value="info" className="text-base">Course Info</TabsTrigger>
            <TabsTrigger value="content" className="text-base">Content</TabsTrigger>
            <TabsTrigger value="feedback" className="text-base">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-10">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Course Description</h2>
              <p className="text-muted-foreground whitespace-pre-line leading-relaxed text-base">
                {courseInfo.description || "Course description not available."}
              </p>
            </Card>

            {objectives.length > 0 && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Trophy className="h-6 w-6 text-primary" />
                  Learning Outcomes
                </h2>
                <ul className="grid md:grid-cols-2 gap-4">
                  {objectives.map((outcome: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <CircleCheckBig className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-base">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {requiredKnowledge.length > 0 && (
              <Card className="p-8">
                <h2 className="text-2xl font-bold mb-5">Requirements</h2>
                <ul className="space-y-3">
                  {requiredKnowledge.map((item: string, index: number) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary mt-2 shrink-0" />
                      <span className="text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-5">Meet Your Instructor</h2>
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {teacherData.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-xl">{teacherData.name}</h3>
                  <p className="text-muted-foreground">{teacherData.email}</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="content">
            <div className="space-y-5">
              {courseInfo.modules.map((module: any, modIdx: number) => (
                <Card key={module.id} className="p-6">
                  <div className="mb-5">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="px-3 py-1">Module {modIdx + 1}</Badge>
                      <h3 className="text-xl font-bold">{module.title}</h3>
                    </div>
                    {module.description && (
                      <p className="text-sm text-muted-foreground ml-20">{module.description}</p>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {module.chapters.map((chapter: any, chapIdx: number) => (
                      <li key={chapter.id} className="flex items-center justify-between p-4 rounded-lg hover:bg-muted/60 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/15 group-hover:bg-primary/25 flex items-center justify-center text-sm font-bold transition-colors">
                            {chapIdx + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-base">{chapter.title}</p>
                            {chapter.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                {chapter.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {chapter.isFree && (
                          <Badge variant="secondary" className="ml-4">Free Preview</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-8">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-6">Student Feedback</h2>
              <div className="flex items-center gap-12 mb-8">
                <div className="text-center">
                  <p className="text-6xl font-extrabold mb-2">{courseInfo.averageRating.toFixed(1)}</p>
                  <div className="flex items-center gap-1.5 justify-center mb-2">
                    {[1, 2, 3, 4, 5].map((starNum) => (
                      <StarIcon
                        key={starNum}
                        className={`h-6 w-6 ${
                          starNum <= courseInfo.averageRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">
                    Based on {courseInfo.ratingCount} reviews
                  </p>
                </div>
              </div>

              <Separator className="my-8" />

              {isStudentEnrolled && (
                <div className="mb-8">
                  <h3 className="font-bold text-lg mb-4">Share Your Experience</h3>
                  <ReviewForm courseId={courseInfo.id} onReviewSubmitted={fetchCourseData} />
                </div>
              )}

              <ReviewsList courseId={courseInfo.id} reviews={courseInfo.reviews || []} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
