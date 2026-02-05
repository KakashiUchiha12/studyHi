"use client"

import { useState, useEffect, useTransition } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import CourseCard from "@/components/courses/CourseCard"
import CourseFilters from "@/components/courses/CourseFilters"
import { Search, LayoutGrid, Rows, RefreshCw, GraduationCap, Home } from "lucide-react"
import Link from "next/link"

export default function ExploreCoursesPage() {
  const { data: userAuth } = useSession()
  const routerControl = useRouter()
  const [displayLayout, setDisplayLayout] = useState<"grid" | "list">("grid")
  const [queryText, setQueryText] = useState("")
  const [refinementOptions, setRefinementOptions] = useState({
    categorySelected: "all",
    levelSelected: "all",
    ratingMin: 0,
    costRange: "all"
  })
  const [catalogItems, setCatalogItems] = useState<any[]>([])
  const [fetchInProgress, beginTransition] = useTransition()
  const [paginationIndex, setPaginationIndex] = useState(1)
  const [maxPages, setMaxPages] = useState(1)
  const [itemCount, setItemCount] = useState(0)

  const retrieveCatalog = async () => {
    beginTransition(async () => {
      const urlBuilder = new URLSearchParams({
        page: String(paginationIndex),
        pageSize: "12",
        status: "published"
      })
      
      queryText && urlBuilder.set("search", queryText)
      refinementOptions.categorySelected !== "all" && urlBuilder.set("category", refinementOptions.categorySelected)
      refinementOptions.levelSelected !== "all" && urlBuilder.set("difficulty", refinementOptions.levelSelected)
      refinementOptions.ratingMin > 0 && urlBuilder.set("rating", String(refinementOptions.ratingMin))
      
      if (refinementOptions.costRange === "free") {
        urlBuilder.set("minPrice", "0")
        urlBuilder.set("maxPrice", "0")
      } else if (refinementOptions.costRange === "paid") {
        urlBuilder.set("minPrice", "0.01")
      }

      try {
        const serverCall = await fetch(`/api/courses?${urlBuilder}`)
        const payload = await serverCall.json()
        
        if (serverCall.ok) {
          setCatalogItems(payload.courses || [])
          setMaxPages(payload.totalPages || 1)
          setItemCount(payload.totalCount || 0)
        }
      } catch (problem) {
        console.error("Catalog retrieval failed:", problem)
      }
    })
  }

  useEffect(() => {
    retrieveCatalog()
  }, [paginationIndex, queryText, refinementOptions])

  useEffect(() => {
    setPaginationIndex(1)
  }, [queryText, refinementOptions])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="border-b bg-card/95 backdrop-blur sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link href="/dashboard">
                <Button variant="ghost" className="gap-2">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <GraduationCap className="h-7 w-7 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Course Catalog</h1>
                  <p className="text-xs text-muted-foreground">{itemCount} available courses</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/courses/my-courses">
                <Button variant="outline">My Courses</Button>
              </Link>
              {userAuth?.user && (
                <Link href="/courses/instructor">
                  <Button className="gap-2">Start Teaching</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <CourseFilters
              currentFilters={refinementOptions}
              onFilterUpdate={setRefinementOptions}
            />
          </div>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Find your next course..."
                  value={queryText}
                  onChange={(e) => setQueryText(e.target.value)}
                  className="pl-12 h-12 text-base"
                />
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="px-3 py-1.5 text-sm">
                  {catalogItems.length} results
                </Badge>
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={displayLayout === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setDisplayLayout("grid")}
                    className="rounded-none"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={displayLayout === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setDisplayLayout("list")}
                    className="rounded-none"
                  >
                    <Rows className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {fetchInProgress ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading courses...</p>
              </div>
            ) : catalogItems.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-xl bg-card">
                <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold mb-2">No Matches Found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We couldn't find any courses matching your criteria. Try different filters or search terms.
                </p>
              </div>
            ) : (
              <>
                <div className={displayLayout === "grid" 
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" 
                  : "space-y-4"}>
                  {catalogItems.map((item) => (
                    <CourseCard key={item.id} courseData={item} />
                  ))}
                </div>

                {maxPages > 1 && (
                  <div className="flex justify-center items-center gap-3 pt-6">
                    <Button
                      variant="outline"
                      disabled={paginationIndex === 1}
                      onClick={() => setPaginationIndex(p => p - 1)}
                    >
                      ← Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(maxPages, 5) }, (_, i) => {
                        const pageNum = i + 1
                        return (
                          <Button
                            key={pageNum}
                            variant={paginationIndex === pageNum ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setPaginationIndex(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                      {maxPages > 5 && <span className="px-2">...</span>}
                    </div>
                    <Button
                      variant="outline"
                      disabled={paginationIndex === maxPages}
                      onClick={() => setPaginationIndex(p => p + 1)}
                    >
                      Next →
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
