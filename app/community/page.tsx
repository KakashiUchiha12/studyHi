"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Users, Search, Globe, Lock } from "lucide-react";
import { StudyHiLogo } from "@/components/ui/studyhi-logo";
import ReactMarkdown from "react-markdown";

interface Community {
    id: string;
    name: string;
    description: string;
    coverImage: string | null;
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
                            <div key={i} className="h-64 rounded-xl bg-muted animate-pulse"></div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {communities.map((community) => (
                            <Link href={`/community/${community.id}`} key={community.id} className="block group">
                                <Card className="h-full hover:shadow-lg transition-all border-border hover:border-primary/50 overflow-hidden flex flex-col p-0 border">
                                    <div className="h-32 bg-gray-100 relative w-full">
                                        {community.coverImage ? (
                                            <img
                                                src={community.coverImage}
                                                alt={community.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center">
                                                <div className="text-4xl font-bold text-primary/20">
                                                    {community.name[0]?.toUpperCase()}
                                                </div>
                                            </div>
                                        )}
                                        {community.isPrivate && (
                                            <div className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full">
                                                <Lock className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex-1">
                                                <CardTitle className="text-xl line-clamp-1" title={community.name}>
                                                    {community.name}
                                                </CardTitle>
                                            </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground line-clamp-2 h-[40px] prose prose-sm max-w-none">
                                            <ReactMarkdown
                                                components={{
                                                    p: ({ node, ...props }) => <p className="mb-0" {...props} />,
                                                    h1: ({ node, ...props }) => <span className="font-bold" {...props} />,
                                                    h2: ({ node, ...props }) => <span className="font-bold" {...props} />,
                                                    ul: ({ node, ...props }) => <span {...props} />,
                                                    li: ({ node, ...props }) => <span className="mr-1" {...props} />,
                                                }}
                                            >
                                                {community.description || "No description provided."}
                                            </ReactMarkdown>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="mt-auto pt-0">
                                        <div className="flex items-center text-sm text-muted-foreground pt-4 border-t">
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
