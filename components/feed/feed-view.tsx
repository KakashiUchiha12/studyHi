"use client";

import { useEffect, useState } from "react";
import { PostCard } from "./post-card";
import { CreatePost } from "./create-post";
import { Loader2 } from "lucide-react";

interface FeedViewProps {
    communityId?: string; // If present, scoped to community
    userId?: string; // If present, scoped to user
    currentUser?: any; // Session user
}

export function FeedView({ communityId, userId, currentUser }: FeedViewProps) {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, [communityId, userId]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (communityId) params.append("communityId", communityId);
            if (userId) params.append("userId", userId);

            const res = await fetch(`/api/posts?${params.toString()}`);
            if (res.ok) {
                setPosts(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleNewPost = (post: any) => {
        setPosts([post, ...posts]);
    };

    return (
        <div className="max-w-2xl mx-auto">
            {currentUser && !userId && (
                <CreatePost
                    communityId={communityId}
                    currentUser={currentUser}
                    onPostCreated={handleNewPost}
                />
            )}

            {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : (
                <div className="space-y-4">
                    {posts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                            No posts found.
                        </div>
                    ) : (
                        posts.map((post) => (
                            <PostCard key={post.id} post={post} currentUserId={currentUser?.id} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
