"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Eye, Heart, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ProjectCardProps {
    project: {
        id: string
        title: string
        description: string
        coverImage?: string | null
        category?: string | null
        tags?: any
        views: number
        createdAt: Date | string
        author: {
            id: string
            name: string | null
            image: string | null
            username?: string | null
        }
        _count: {
            likes: number
            comments: number
        }
    }
}

export function ProjectCard({ project }: ProjectCardProps) {
    const tags = project.tags ? (typeof project.tags === 'string' ? JSON.parse(project.tags) : project.tags) : []
    const createdAt = typeof project.createdAt === 'string' ? new Date(project.createdAt) : project.createdAt

    return (
        <Link href={`/projects/${project.id}`}>
            <Card className="group overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer h-full flex flex-col">
                <CardHeader className="p-0">
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                        {project.coverImage ? (
                            <Image
                                src={project.coverImage}
                                alt={project.title}
                                fill
                                className="object-cover transition-transform group-hover:scale-105"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                                <span className="text-4xl font-bold text-muted-foreground/20">
                                    {project.title.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-4 space-y-3">
                    <div className="space-y-2">
                        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                            {project.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {project.description}
                        </p>
                    </div>

                    {project.category && (
                        <Badge variant="secondary" className="text-xs">
                            {project.category}
                        </Badge>
                    )}

                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {tags.slice(0, 3).map((tag: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                </Badge>
                            ))}
                            {tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{tags.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}
                </CardContent>

                <CardFooter className="p-4 pt-0 flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={project.author.image || undefined} alt={project.author.name || "User"} />
                            <AvatarFallback className="text-xs">
                                {project.author.name?.charAt(0).toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-xs truncate max-w-[100px]">
                            {project.author.name || "Anonymous"}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{project.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" />
                            <span>{project._count.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>{project._count.comments}</span>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </Link>
    )
}
