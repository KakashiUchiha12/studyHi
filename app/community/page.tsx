"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Users, Search, Globe, Lock } from "lucide-react";
import { StudyHiLogo } from "@/components/ui/studyhi-logo";

interface Community {
    id: string;
    name: string;
    description: string;
    _count: {
        members: number;
    };
    isPrivate: boolean;
}

export default function CommunityPage() {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetchCommunities();
    }, []);

    const fetchCommunities = async (query?: string) => {
        setLoading(true);
        try {
            const url = query
                ? `/api/communities?query=${encodeURIComponent(query)}`
                : "/api/communities";
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setCommunities(data);
            }
        } catch (error) {
            console.error("Failed to fetch communities", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchCommunities(searchQuery);
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="border-b border-border bg-white px-4 py-4 sticky top-0 z-10">
                <div className="container mx-auto max-w-6xl flex items-center justify-between">
                    <Link href="/dashboard">
                        <StudyHiLogo size="sm" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost">Dashboard</Button>
                        </Link>
                        <Link href="/community/create">
                            <Button className="bg-primary text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Community
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto max-w-6xl px-4 py-8">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold mb-4">Explore Communities</h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
                        Join study groups, discuss topics, and collaborate with students worldwide.
                    </p>

                    <form onSubmit={handleSearch} className="max-w-xl mx-auto relative flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Search communities..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button type="submit">Search</Button>
                    </form>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-48 rounded-xl bg-muted animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {communities.map((community) => (
                            <Link href={`/community/${community.id}`} key={community.id} className="block group">
                                <Card className="h-full hover:shadow-md transition-all border-border hover:border-primary/50">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xl mb-2 group-hover:bg-primary group-hover:text-white transition-colors">
                                                {community.name[0].toUpperCase()}
                                            </div>
                                            {community.isPrivate ? (
                                                <Lock className="w-4 h-4 text-muted-foreground" />
                                            ) : (
                                                <Globe className="w-4 h-4 text-muted-foreground" />
                                            )}
                                        </div>
                                        <CardTitle className="text-xl">{community.name}</CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {community.description || "No description provided."}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-sm text-muted-foreground">
                                            <Users className="w-4 h-4 mr-2" />
                                            {community._count.members} members
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}

                        {communities.length === 0 && (
                            <div className="col-span-full text-center py-12 text-muted-foreground">
                                <p>No communities found. Why not create one?</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
