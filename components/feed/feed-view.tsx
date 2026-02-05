"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { PostCard } from "./post-card";
import { CreatePost } from "./create-post";
import { Loader2 } from "lucide-react";
import { pusherClient } from "@/lib/pusher";
import { useQueryClient } from "@tanstack/react-query";

interface FeedViewProps {
    communityId?: string;
    userId?: string;
    currentUser?: any;
    isAnnouncement?: boolean;
}

export function FeedView({ communityId, userId, currentUser, isAnnouncement }: FeedViewProps) {
    const [isAdmin, setIsAdmin] = useState(false);
    const loadMoreRef = useRef<HTMLDivElement>(null);

    // Fetch admin status with React Query (only for community views)
    const { data: adminCheckData } = useQuery({
        queryKey: ['admin-check', communityId, currentUser?.id],
        queryFn: async () => {
            if (!communityId || !currentUser) return { isAdmin: false };
            const res = await fetch(`/api/communities/${communityId}/members`);
            if (!res.ok) return { isAdmin: false };
            const members = await res.json();
            const me = members.find((m: any) => m.userId === currentUser.id);
            return { isAdmin: me && (me.role === 'admin' || me.role === 'moderator') };
        },
        enabled: !!(communityId && currentUser),
        staleTime: 60000,
    });

    // Fetch posts with infinite scroll pagination
    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage
    } = useInfiniteQuery({
        queryKey: ['posts', communityId, userId, isAnnouncement],
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams();
            if (communityId) params.append("communityId", communityId);
            if (userId) params.append("userId", userId);
            if (isAnnouncement) params.append("isAnnouncement", "true");
            if (pageParam) params.append("cursor", pageParam);

            const res = await fetch(`/api/posts?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch posts');
            return res.json();
        },
        getNextPageParam: (lastPage) => {
            // If we got a full page (20 posts), there might be more
            if (lastPage && lastPage.length === 20) {
                return lastPage[lastPage.length - 1].id;
            }
            return undefined;
        },
        initialPageParam: undefined,
        staleTime: 30000,
    });

    // Flatten all pages into single array
    const posts = data?.pages.flatMap(page => page) ?? [];

    // Update admin state when data changes
    useEffect(() => {
        if (adminCheckData) {
            setIsAdmin(adminCheckData.isAdmin);
        }
    }, [adminCheckData]);

    // Instagram-style infinite scroll: auto-load when scrolling near bottom
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const firstEntry = entries[0];
                if (firstEntry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1, rootMargin: '100px' } // Trigger 100px before reaching the element
        );

        const currentRef = loadMoreRef.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    const queryClient = useQueryClient();

    // Real-time Updates with Pusher
    useEffect(() => {
        if (!pusherClient) return;

        const channelName = communityId
            ? `community-${communityId}`
            : 'global-feed';

        const channel = pusherClient.subscribe(channelName);

        channel.bind('new-post', (newPost: any) => {
            // Check if post already exists (prevent duplicates from own creation or double firing)
            // But actually, we want to see other people's posts.

            queryClient.setQueryData(['posts', communityId, userId, isAnnouncement], (oldData: any) => {
                if (!oldData || !oldData.pages) return oldData;

                // Create a new first page with the new post prepended
                const firstPage = oldData.pages[0];

                // Avoid duplication if the user is the one who posted (optimistic update might have handled it, 
                // or we rely on this real-time update. If optimisitic update is used, we need to dedup by ID)
                if (firstPage.some((p: any) => p.id === newPost.id)) {
                    return oldData;
                }

                const newFirstPage = [newPost, ...firstPage];

                return {
                    ...oldData,
                    pages: [newFirstPage, ...oldData.pages.slice(1)]
                };
            });
        });

        channel.bind('post-updated', (updatedData: { id: string, _count: any }) => {
            console.log("Real-time post update received:", updatedData);

            queryClient.setQueryData(['posts', communityId, userId, isAnnouncement], (oldData: any) => {
                if (!oldData || !oldData.pages) return oldData;

                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any[]) =>
                        page.map((post: any) =>
                            post.id === updatedData.id
                                ? { ...post, _count: { ...post._count, ...updatedData._count } }
                                : post
                        )
                    )
                };
            });
        });

        return () => {
            pusherClient.unsubscribe(channelName);
            channel.unbind_all();
        };
    }, [communityId, userId, isAnnouncement, queryClient]);

    const handleNewPost = (post: any) => {
        // Optimistically add to cache immediately
        console.log("Optimistically adding new post to top of feed:", post.id);

        queryClient.setQueryData(['posts', communityId, userId, isAnnouncement], (oldData: any) => {
            if (!oldData || !oldData.pages) return { pages: [[post]], pageParams: [undefined] };

            // Create a new first page with the new post prepended
            const firstPage = oldData.pages[0];

            // Avoid duplicate if it already exists
            if (firstPage.some((p: any) => p.id === post.id)) {
                return oldData;
            }

            const newFirstPage = [post, ...firstPage];

            return {
                ...oldData,
                pages: [newFirstPage, ...oldData.pages.slice(1)]
            };
        });
    };

    const canCreatePost = () => {
        if (!currentUser) return false;
        if (userId && currentUser.id !== userId) return false; // On someone else's profile

        // Announcement Rule: Only Admins can post announcements
        if (isAnnouncement && !isAdmin) return false;

        return true;
    };

    return (
        <div className="max-w-2xl mx-auto">
            {canCreatePost() && (
                <CreatePost
                    communityId={communityId}
                    currentUser={currentUser}
                    onPostCreated={handleNewPost}
                    isAnnouncementMode={isAnnouncement}
                />
            )}

            {!canCreatePost() && isAnnouncement && communityId && (
                <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-lg text-sm text-center">
                    Only admins can post announcements.
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
            ) : (
                <div className="space-y-2 sm:space-y-4">
                    {posts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                            No posts found.
                        </div>
                    ) : (
                        <>
                            {posts.map((post: any) => (
                                <PostCard key={post.id} post={post} currentUserId={currentUser?.id} />
                            ))}

                            {/* Invisible trigger element for infinite scroll */}
                            <div ref={loadMoreRef} className="h-20 flex items-center justify-center">
                                {isFetchingNextPage && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-sm">Loading more posts...</span>
                                    </div>
                                )}
                                {!hasNextPage && posts.length > 0 && (
                                    <div className="text-center text-sm text-muted-foreground py-6">
                                        You've reached the end 🎉
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
