"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ProfileProjects } from "@/components/profile/profile-projects";

export default function UserProjectsPage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchProfile(params.id as string);
        }
    }, [params.id]);

    const fetchProfile = async (id: string) => {
        try {
            const res = await fetch(`/api/users/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block" /></div>;
    if (!profile) return <div className="p-8 text-center">User not found</div>;

    return (
        <div className="container max-w-4xl py-6 px-4 md:py-10">
            <div className="mb-6 flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Profile
                </Button>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-100">
                        <img src={profile.image || "/placeholder-user.jpg"} alt={profile.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{profile.name}'s Projects</h1>
                        <p className="text-muted-foreground text-sm">Viewing all projects</p>
                    </div>
                </div>

                <ProfileProjects userId={profile.id} />
            </div>
        </div>
    );
}
