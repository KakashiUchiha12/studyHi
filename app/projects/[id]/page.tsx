import { notFound } from "next/navigation"

export const dynamic = 'force-dynamic'

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getProjectById, getProjectComments } from "@/lib/projects/projectService"
import { ProjectSections } from "@/components/projects/project-sections"
import { ProjectActions } from "@/components/projects/project-actions"
import { ProjectComments } from "@/components/projects/project-comments"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Eye, Calendar, MessageCircle, Heart } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Image from "next/image"
import Link from "next/link"

interface ProjectPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    const [project, comments] = await Promise.all([
        getProjectById(id, userId),
        getProjectComments(id),
    ])

    if (!project) {
        notFound()
    }

    const tags = project.tags
        ? typeof project.tags === "string"
            ? JSON.parse(project.tags)
            : project.tags
        : []

    const isLiked = userId ? project.likes?.some((like: any) => like.userId === userId) : false
    const isAuthor = userId === project.author.id
    const createdAt = typeof project.createdAt === "string" ? new Date(project.createdAt) : project.createdAt

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            {/* Cover Image */}
            {project.coverImage && (
                <div className="relative aspect-video w-full rounded-lg overflow-hidden mb-8">
                    <Image
                        src={project.coverImage}
                        alt={project.title}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            )}

            {/* Header */}
            <div className="space-y-6 mb-12">
                <div className="space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">{project.title}</h1>
                    <p className="text-xl text-muted-foreground">{project.description}</p>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <Link
                        href={`/profile/${project.author.username || project.author.id}`}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <Avatar className="h-8 w-8">
                            <AvatarImage
                                src={project.author.image || undefined}
                                alt={project.author.name || "Author"}
                            />
                            <AvatarFallback>
                                {project.author.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground hover:underline">
                            {project.author.name || "Anonymous"}
                        </span>
                    </Link>

                    <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDistanceToNow(createdAt, { addSuffix: true })}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{project.viewCount} views</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{project._count.likes} likes</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{project._count.comments} comments</span>
                    </div>
                </div>

                {/* Tags and Category */}
                <div className="flex flex-wrap gap-2">
                    {project.category && (
                        <Badge variant="secondary">{project.category}</Badge>
                    )}
                    {tags.map((tag: string) => (
                        <Badge key={tag} variant="outline">
                            {tag}
                        </Badge>
                    ))}
                </div>

                {/* Actions */}
                <ProjectActions
                    projectId={project.id}
                    isLiked={isLiked}
                    likeCount={project._count.likes}
                    isAuthor={isAuthor}
                />
            </div>

            {/* Sections */}
            <div className="mb-12">
                <ProjectSections sections={project.sections} />
            </div>

            {/* Comments */}
            <ProjectComments
                projectId={project.id}
                initialComments={comments}
                currentUserId={userId}
            />
        </div>
    )
}
