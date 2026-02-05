"use client";

import { useState, useEffect, useRef } from "react";
import { Search, User, FileText, BookOpen, Loader2, X, Filter, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

type SearchTab = "all" | "users" | "posts" | "documents" | "subjects";

export function FeedSearchBar() {
    const [query, setQuery] = useState("");
    const [activeTab, setActiveTab] = useState<SearchTab>("all");
    const [results, setResults] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const search = async () => {
            if (!query.trim()) {
                setResults({});
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${activeTab}&limit=5`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(search, 300);
        return () => clearTimeout(timer);
    }, [query, activeTab]);

    const handleResultClick = (type: string, id: string, extra?: { postId?: string }) => {
        setIsOpen(false);
        setQuery("");
        switch (type) {
            case "user":
                router.push(`/profile/${id}`);
                break;
            case "post":
                router.push(`/feed?postId=${id}`);
                break;
            case "document":
                if (extra?.postId) {
                    router.push(`/feed?postId=${extra.postId}`);
                } else {
                    router.push(`/drive?fileId=${id}`);
                }
                break;
            case "subject":
                router.push(`/subjects/${id}`);
                break;
        }
    };

    const hasResults = Object.values(results).some((arr: any) => arr?.length > 0);

    return (
        <div ref={containerRef} className="relative w-full max-w-2xl mx-auto mb-6 px-2 md:px-0">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                    placeholder="Search users, posts, docs, subjects..."
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className="pl-10 h-11 bg-white border-muted-foreground/20 focus-visible:ring-primary shadow-sm rounded-xl text-base"
                />
                {query && (
                    <button
                        onClick={() => { setQuery(""); setResults({}); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Results Dropdown */}
            {isOpen && (query.trim() || loading) && (
                <Card className="absolute top-full left-0 right-0 mt-2 z-50 border-muted-foreground/20 shadow-xl max-h-[80vh] overflow-hidden flex flex-col rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Tabs / Filters */}
                    <div className="flex gap-1 p-2 border-b bg-muted/30 overflow-x-auto scrollbar-hide">
                        {(["all", "users", "posts", "documents", "subjects"] as SearchTab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-all capitalize whitespace-nowrap",
                                    activeTab === tab
                                        ? "bg-white text-primary shadow-sm border border-muted-foreground/10"
                                        : "text-muted-foreground hover:bg-muted"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                        ) : !hasResults ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p className="text-sm">No results found for "{query}"</p>
                            </div>
                        ) : (
                            <>
                                {/* Users Section */}
                                {results.users?.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
                                            <span>Users</span>
                                            <Badge variant="outline" className="font-normal">{results.users.length}</Badge>
                                        </h3>
                                        {results.users.map((user: any) => (
                                            <div
                                                key={user.id}
                                                onClick={() => handleResultClick("user", user.id)}
                                                className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer group"
                                            >
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={user.image} />
                                                    <AvatarFallback>{user.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium leading-none mb-1 group-hover:text-primary transition-colors">{user.name}</p>
                                                    <p className="text-xs text-muted-foreground truncate">@{user.username || user.email.split('@')[0]}</p>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Posts Section */}
                                {results.posts?.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
                                            <span>Posts</span>
                                            <Badge variant="outline" className="font-normal">{results.posts.length}</Badge>
                                        </h3>
                                        {results.posts.map((post: any) => (
                                            <div
                                                key={post.id}
                                                onClick={() => handleResultClick("post", post.id)}
                                                className="p-2 hover:bg-muted/50 rounded-lg cursor-pointer group"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Avatar className="h-5 w-5">
                                                        <AvatarImage src={post.user.image} />
                                                        <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-medium">{post.user.name}</span>
                                                    <span className="text-[10px] text-muted-foreground">• {new Date(post.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-sm line-clamp-2 group-hover:text-primary transition-colors">{post.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Documents Section */}
                                {results.documents?.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
                                            <span>Documents</span>
                                            <Badge variant="outline" className="font-normal">{results.documents.length}</Badge>
                                        </h3>
                                        {results.documents.map((doc: any) => (
                                            <div
                                                key={doc.id}
                                                onClick={() => handleResultClick("document", doc.id, { postId: doc.postId })}
                                                className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer group"
                                            >
                                                <div className="h-9 w-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                                    <FileText className="h-5 w-5 text-blue-500" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{doc.originalName}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="text-[10px] h-4 py-0">{doc.fileType}</Badge>
                                                        <span className="text-[10px] text-muted-foreground">by {doc.user?.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Subjects Section */}
                                {results.subjects?.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2 flex items-center justify-between">
                                            <span>Subjects</span>
                                            <Badge variant="outline" className="font-normal">{results.subjects.length}</Badge>
                                        </h3>
                                        {results.subjects.map((sub: any) => (
                                            <div
                                                key={sub.id}
                                                onClick={() => handleResultClick("subject", sub.id)}
                                                className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer group"
                                            >
                                                <div
                                                    className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                                                    style={{ backgroundColor: sub.color + '20', color: sub.color }}
                                                >
                                                    <BookOpen className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{sub.name}</p>
                                                    <p className="text-[10px] text-muted-foreground">{sub.code || 'Academic'} • {sub.user?.name}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {hasResults && (
                        <div className="p-3 border-t bg-muted/10 text-center">
                            <p className="text-[10px] text-muted-foreground italic">
                                Tip: Use the tabs above to narrow down your results
                            </p>
                        </div>
                    )}
                </Card>
            )}
        </div>
    );
}
