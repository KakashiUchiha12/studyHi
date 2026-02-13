"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, FolderGit2, ArrowRight } from "lucide-react";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";

interface ProfileProjectsProps {
    userId: string;
    limit?: number;
}

export function ProfileProjects({ userId, limit }: ProfileProjectsProps) {
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
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(limit ? projects.slice(0, limit) : projects).map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>
            {limit && projects.length > limit && (
                <div className="flex justify-center mt-2">
                    <Button variant="ghost" size="sm" asChild className="text-sm">
                        <Link href={`/profile/${userId}/projects`}>
                            See All Projects
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
