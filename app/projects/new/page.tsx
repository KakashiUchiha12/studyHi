import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ProjectForm } from "@/components/projects/project-form"

export default async function NewProjectPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect("/auth/signin?callbackUrl=/projects/new")
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Create New Project</h1>
                <p className="text-muted-foreground mt-2">
                    Share your amazing project with the community
                </p>
            </div>

            <ProjectForm mode="create" />
        </div>
    )
}
