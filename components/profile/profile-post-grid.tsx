"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquare, Heart, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PostCard } from "@/components/feed/post-card";
import { cn } from "@/lib/utils";

interface ProfilePostGridProps {
    userId: string;
    currentUserId?: string;
}

export function ProfilePostGrid({ userId, currentUserId }: ProfilePostGridProps) {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, [userId]);

    const fetchPosts = async () => {
        try {
            const res = await fetch(`/api/posts?userId=${userId}`);
            if (res.ok) {
                setPosts(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (posts.length === 0) {
        return (
            <div className="bg-slate-50 rounded-lg p-12 text-center border border-dashed">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-muted-foreground">No posts yet.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {posts.map((post) => {
                const hasMedia = post.attachments && post.attachments.length > 0;
                const firstMedia = hasMedia ? post.attachments[0] : null;

                return (
                    <Dialog key={post.id}>
                        <DialogTrigger asChild>
                            <div className="aspect-square relative cursor-pointer group bg-slate-100 overflow-hidden rounded-md border">
                                {hasMedia ? (
                                    <img
                                        src={firstMedia.url}
                                        alt="Post content"
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full p-4 flex items-center justify-center bg-white text-xs md:text-sm text-center text-muted-foreground select-none">
                                        {post.content.length > 50 ? post.content.slice(0, 50) + "..." : post.content}
                                    </div>
                                )}

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold">
                                    <div className="flex items-center gap-1">
                                        <Heart className="w-5 h-5 fill-white" />
                                        <span>{post._count?.likes || 0}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="w-5 h-5 fill-white" />
                                        <span>{post._count?.comments || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl w-full p-0 overflow-hidden border-none bg-transparent shadow-none">
                            <div className="bg-background rounded-lg overflow-hidden">
                                <PostCard post={post} currentUserId={currentUserId} />
                            </div>
                        </DialogContent>
                    </Dialog>
                );
            })}
        </div>
    );
}
