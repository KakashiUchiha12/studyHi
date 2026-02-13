"use client";

import { useEffect, useState } from "react";
import { Loader2, FolderGit2 } from "lucide-react";
import { ProjectCard } from "@/components/projects/project-card";

interface ProfileProjectsProps {
    userId: string;
}

export function ProfileProjects({ userId }: ProfileProjectsProps) {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                // Fetch projects authored by this user
                const res = await fetch(`/api/projects?authorId=${userId}`);
                if (res.ok) {
                    const data = await res.json();
                    setProjects(data.projects || []);
                }
            } catch (e) {
                console.error("Failed to fetch projects", e);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [userId]);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    if (projects.length === 0) {
        return (
            <div className="bg-slate-50 rounded-lg p-12 text-center border border-dashed">
                <FolderGit2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-muted-foreground">No projects yet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
            ))}
        </div>
    );
}
