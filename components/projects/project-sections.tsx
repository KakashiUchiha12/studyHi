interface ProjectSection {
    id: string
    order: number
    title: string
    content: string
    images?: any
    videoUrl?: string | null
    videoType?: string | null
    websiteUrl?: string | null
}

interface ProjectSectionsProps {
    sections: ProjectSection[]
}

export function ProjectSections({ sections }: ProjectSectionsProps) {
    if (!sections || sections.length === 0) {
        return null
    }

    const sortedSections = [...sections].sort((a, b) => a.order - b.order)

    return (
        <div className="space-y-12">
            {sortedSections.map((section) => {
                const images = section.images
                    ? typeof section.images === "string"
                        ? JSON.parse(section.images)
                        : section.images
                    : []

                return (
                    <section key={section.id} className="space-y-4">
                        <h2 className="text-2xl font-bold">{section.title}</h2>

                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <p className="whitespace-pre-wrap">{section.content}</p>
                        </div>

                        {section.videoUrl && (
                            <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
                                {section.videoUrl.includes("youtube.com") ||
                                    section.videoUrl.includes("youtu.be") ? (
                                    <iframe
                                        src={getYouTubeEmbedUrl(section.videoUrl)}
                                        className="w-full h-full"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <video src={section.videoUrl} controls className="w-full h-full" />
                                )}
                            </div>
                        )}

                        {section.websiteUrl && (
                            <div className="w-full rounded-lg overflow-hidden border bg-muted">
                                <div className="bg-background p-2 border-b flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Embedded Website:</span>
                                    <a
                                        href={section.websiteUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-primary hover:underline truncate"
                                    >
                                        {section.websiteUrl}
                                    </a>
                                </div>
                                <iframe
                                    src={section.websiteUrl}
                                    className="w-full h-[600px]"
                                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                                    loading="lazy"
                                />
                            </div>
                        )}

                        {images.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {images.map((image: string, idx: number) => (
                                    <div
                                        key={idx}
                                        className="relative aspect-video rounded-lg overflow-hidden bg-muted"
                                    >
                                        <img
                                            src={image}
                                            alt={`${section.title} - Image ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )
            })}
        </div>
    )
}

function getYouTubeEmbedUrl(url: string): string {
    const videoId = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/
    )?.[1]
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url
}
