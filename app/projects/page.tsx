import { Suspense } from "react"
import { getProjects } from "@/lib/projects/projectService"
import { ProjectCard } from "@/components/projects/project-card"
import { ProjectsFilters } from "@/components/projects/projects-filters"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus } from "lucide-react"
import Link from "next/link"

interface ProjectsPageProps {
    searchParams: {
        page?: string
        category?: string
        search?: string
        sortBy?: string
    }
}

function ProjectCardSkeleton() {
    return (
        <div className="space-y-3">
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
        </div>
    )
}

async function ProjectsList({ searchParams }: ProjectsPageProps) {
    const page = parseInt(searchParams.page || "1")
    const filters = {
        category: searchParams.category,
        search: searchParams.search,
    }
    const options = {
        page,
        limit: 12,
        sortBy: (searchParams.sortBy || "newest") as "newest" | "popular" | "mostLiked" | "mostViewed",
    }

    const { projects, pagination } = await getProjects(filters, options)

    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-lg text-muted-foreground mb-4">No projects found</p>
                <p className="text-sm text-muted-foreground mb-6">
                    Try adjusting your filters or create a new project
                </p>
                <Button asChild>
                    <Link href="/projects/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>

            {pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    {page > 1 && (
                        <Button variant="outline" asChild>
                            <Link href={`/projects?page=${page - 1}`}>Previous</Link>
                        </Button>
                    )}
                    <div className="flex items-center gap-2 px-4">
                        <span className="text-sm text-muted-foreground">
                            Page {page} of {pagination.totalPages}
                        </span>
                    </div>
                    {page < pagination.totalPages && (
                        <Button variant="outline" asChild>
                            <Link href={`/projects?page=${page + 1}`}>Next</Link>
                        </Button>
                    )}
                </div>
            )}
        </>
    )
}

export default function ProjectsPage({ searchParams }: ProjectsPageProps) {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground mt-2">
                        Explore and share amazing projects from the community
                    </p>
                </div>
                <Button asChild>
                    <Link href="/projects/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Project
                    </Link>
                </Button>
            </div>

            <div className="mb-8">
                <ProjectsFilters />
            </div>

            <Suspense
                fallback={
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <ProjectCardSkeleton key={i} />
                        ))}
                    </div>
                }
            >
                <ProjectsList searchParams={searchParams} />
            </Suspense>
        </div>
    )
}
