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
    urlData.chapterId && courseStructure && selectChapter(urlData.chapterId as string)
  }, [urlData.chapterId, courseStructure])

  const loadCourseStructure = async () => {
    try {
      const apiEndpoint = `/api/courses?slug=${urlData.slug}`
      const response = await fetch(apiEndpoint)
      const data = await response.json()
      
      if (response.ok && data.courses?.[0]) {
        setCourseStructure(data.courses[0])
        fetchProgress(data.courses[0].id)
      }
    } catch (err) {
      console.error("Failed to load:", err)
    } finally {
      setDataLoading(false)
    }
  }

  const fetchProgress = async (courseId: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`)
      const data = await response.json()
      setProgressData(data.enrollmentDetails)
    } catch (err) {
      console.error("Progress fetch error:", err)
    }
  }

  const selectChapter = (chapterId: string) => {
    if (!courseStructure) return
    
    for (const mod of courseStructure.modules) {
      const found = mod.chapters.find((ch: any) => ch.id === chapterId)
      if (found) {
        setActiveChapter(found)
        break
      }
    }
  }

  const markComplete = async () => {
    if (!activeChapter || !courseStructure) return
    
    try {
      await fetch(`/api/courses/${courseStructure.id}/chapters/${activeChapter.id}/complete`, {
        method: "POST"
      })
      fetchProgress(courseStructure.id)
    } catch (err) {
      console.error("Mark complete error:", err)
    }
  }

  const navigateToChapter = (chapterId: string) => {
    navigateControl.push(`/courses/${urlData.slug}/learn/${chapterId}`)
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

  const completedChapters = progressData?.chapterProgress?.length || 0
  const totalChapters = courseStructure.modules.reduce(
    (sum: number, m: any) => sum + m.chapters.length, 0
  )
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
            <div className="h-full flex flex-col">
              <CoursePlayer chapterId={activeChapter.id} />
              
              <div className="p-6 border-t bg-card">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-start justify-between gap-6 mb-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">{activeChapter.title}</h2>
                      {activeChapter.description && (
                        <p className="text-muted-foreground">{activeChapter.description}</p>
                      )}
                    </div>
                    <Button onClick={markComplete} className="gap-2 shrink-0">
                      <CheckSquare className="h-4 w-4" />
                      Mark Complete
                    </Button>
                  </div>
                </div>
              </div>
            </div>
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
              modules={courseStructure.modules}
              currentChapterId={activeChapter?.id}
              completedChapterIds={progressData?.chapterProgress?.map((cp: any) => cp.chapterId) || []}
              onChapterSelect={navigateToChapter}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
