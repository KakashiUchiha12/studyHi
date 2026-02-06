"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import CoursePlayer from "@/components/courses/CoursePlayer"
import ChapterList from "@/components/courses/ChapterList"
import { CheckSquare, X, Menu, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function LearningInterface() {
  const urlData = useParams()
  const navigateControl = useRouter()
  const { data: authSession } = useSession()
  const [courseStructure, setCourseStructure] = useState<any>(null)
  const [activeChapter, setActiveChapter] = useState<any>(null)
  const [progressData, setProgressData] = useState<any>(null)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    urlData.slug && loadCourseStructure()
  }, [urlData.slug])

  useEffect(() => {
    urlData.chapterId && courseStructure && findAndSetActiveChapter(courseStructure, urlData.chapterId as string)
  }, [urlData.chapterId, courseStructure])

  const loadCourseStructure = async () => {
    try {
      setDataLoading(true)
      // First get the course by slug to find the ID
      const listRes = await fetch(`/api/courses?slug=${urlData.slug}`)
      const listData = await listRes.json()

      if (listRes.ok && listData.courses?.[0]) {
        const briefCourse = listData.courses[0]

        // Now get full details including sections and quizzes
        const detailsRes = await fetch(`/api/courses/${briefCourse.id}`)
        const fullData = await detailsRes.json()

        if (detailsRes.ok) {
          setCourseStructure(fullData)
          setProgressData(fullData.enrollmentDetails)

          // Select correct chapter if chapterId is in URL
          if (urlData.chapterId) {
            findAndSetActiveChapter(fullData, urlData.chapterId as string)
          }
        }
      }
    } catch (err) {
      console.error("Failed to load:", err)
    } finally {
      setDataLoading(false)
    }
  }

  const findAndSetActiveChapter = (structure: any, chapterId: string) => {
    for (const mod of structure.modules) {
      const found = mod.chapters.find((ch: any) => ch.id === chapterId)
      if (found) {
        setActiveChapter(found)
        return found
      }
    }
    return null
  }

  const navigateToChapter = (chapterId: string) => {
    navigateControl.push(`/courses/${urlData.slug}/learn/${chapterId}`)
  }

  const handleNextPrev = (direction: 'prev' | 'next') => {
    if (!courseStructure || !activeChapter) return

    const allChapters: any[] = []
    courseStructure.modules.forEach((m: any) => {
      allChapters.push(...m.chapters)
    })

    const currentIndex = allChapters.findIndex(ch => ch.id === activeChapter.id)
    if (direction === 'next' && currentIndex < allChapters.length - 1) {
      navigateToChapter(allChapters[currentIndex + 1].id)
    } else if (direction === 'prev' && currentIndex > 0) {
      navigateToChapter(allChapters[currentIndex - 1].id)
    }
  }

  if (dataLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-3">
        <RefreshCw className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading learning environment...</p>
      </div>
    )
  }

  if (!courseStructure) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold mb-4">Course Unavailable</p>
          <Link href="/courses">
            <Button>Back to Courses</Button>
          </Link>
        </div>
      </div>
    )
  }

  const allChaptersList: any[] = []
  courseStructure.modules.forEach((m: any) => {
    allChaptersList.push(...m.chapters)
  })
  const currentChapterIndex = allChaptersList.findIndex(ch => ch.id === activeChapter?.id)

  const completedChapters = progressData?.chapterProgress?.length || 0
  const totalChapters = allChaptersList.length
  const progressPercent = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="lg:hidden"
          >
            {sidebarVisible ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div>
            <h1 className="font-bold text-lg line-clamp-1">{courseStructure.title}</h1>
            <p className="text-sm text-muted-foreground">
              {completedChapters} / {totalChapters} completed
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <Progress value={progressPercent} className="w-32 h-2" />
            <span className="text-sm font-medium">{Math.round(progressPercent)}%</span>
          </div>
          <Link href={`/courses/${urlData.slug}`}>
            <Button variant="outline" size="sm">Exit</Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-auto">
          {activeChapter ? (
            <CoursePlayer
              chapterInfo={activeChapter}
              courseId={courseStructure.id}
              enrollmentId={progressData?.id || ""}
              onComplete={loadCourseStructure}
              onNavigate={handleNextPrev}
              hasNext={currentChapterIndex < allChaptersList.length - 1}
              hasPrev={currentChapterIndex > 0}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">Select a chapter to begin</p>
            </div>
          )}
        </main>

        <aside className={`${sidebarVisible ? "block" : "hidden"} lg:block w-full lg:w-96 border-l bg-card overflow-auto`}>
          <div className="p-6">
            <h3 className="font-bold text-lg mb-4">Course Content</h3>
            <ChapterList
              moduleGroups={courseStructure.modules}
              activeChapterId={activeChapter?.id}
              userEnrolled={true}
              onChapterSelect={navigateToChapter}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
