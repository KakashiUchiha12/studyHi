import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getProjectById } from "@/lib/projects/projectService"
import { ProjectForm } from "@/components/projects/project-form"

interface EditProjectPageProps {
    params: {
        id: string
    }
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
    const { id } = params
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/auth/signin?callbackUrl=/projects/" + id + "/edit")
    }

    const userId = (session.user as any).id
    const project = await getProjectById(id, userId)

    if (!project) {
        redirect("/projects")
    }

    // Check if user is the author
    if (project.author.id !== userId) {
        redirect(`/projects/${id}`)
    }

    // Parse tags if they're stored as JSON
    const tags = project.tags
        ? typeof project.tags === "string"
            ? JSON.parse(project.tags)
            : project.tags
        : []

    const initialData = {
        id: project.id,
        title: project.title,
        description: project.description,
        coverImage: project.coverImage || undefined,
        category: project.category || undefined,
        tags,
        sections: project.sections,
        isPublished: project.isPublished,
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Edit Project</h1>
                <p className="text-muted-foreground mt-2">
                    Update your project details
                </p>
            </div>

            <ProjectForm initialData={initialData} mode="edit" />
        </div>
    )
}
