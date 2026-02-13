"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

export default function LearnRedirect() {
    const params = useParams()
    const router = useRouter()
    const [error, setError] = useState(false)

    useEffect(() => {
        const fetchAndRedirect = async () => {
            try {
                const slug = params.slug
                if (!slug) return

                // Fetch course to find first chapter
                const response = await fetch(`/api/courses?slug=${slug}`)
                const data = await response.json()

                if (response.ok && data.courses?.[0]) {
                    const course = data.courses[0]

                    // Find first chapter in first module
                    const firstChapterId = course.modules?.[0]?.chapters?.[0]?.id

                    if (firstChapterId) {
                        router.replace(`/courses/${slug}/learn/${firstChapterId}`)
                    } else {
                        // No chapters found, go back to course details
                        router.replace(`/courses/${slug}`)
                    }
                } else {
                    setError(true)
                }
            } catch (err) {
                console.error("Redirect error:", err)
                setError(true)
            }
        }

        fetchAndRedirect()
    }, [params.slug, router])

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-2">Course Error</h2>
                    <p className="text-muted-foreground mb-4">We couldn't load the course structure.</p>
                    <button
                        onClick={() => router.push('/courses')}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                    >
                        Back to Catalog
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Entering the classroom...</p>
        </div>
    )
}
