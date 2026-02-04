"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, MessageSquare, Share2, MoreHorizontal, FileText, Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CommentItem } from "./comment-item";
import { ImageViewer } from "@/components/ui/image-viewer";

interface PostCardProps {
    post: any;
    currentUserId?: string;
}

export function PostCard({ post, currentUserId }: PostCardProps) {
    const [liked, setLiked] = useState(post.likes && post.likes.length > 0);
    const [likeCount, setLikeCount] = useState(post._count.likes);
    const [commentsOpen, setCommentsOpen] = useState(false);
    const [comments, setComments] = useState<any[]>([]);
    const [commentText, setCommentText] = useState("");
    const [loadingComments, setLoadingComments] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [commentCount, setCommentCount] = useState(post._count.comments);

    // Sync state with props when they change (real-time updates from FeedView)
    useEffect(() => {
        setLiked(post.likes && post.likes.length > 0);
        setLikeCount(post._count.likes);
        setCommentCount(post._count.comments);
    }, [post.likes, post._count.likes, post._count.comments]);

    const toggleLike = async () => {
        // Optimistic update
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);

        try {
            await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
        } catch (e) {
            // Revert on error
            setLiked(!newLiked);
            setLikeCount(likeCount);
        }
    };

    const loadComments = async () => {
        if (commentsOpen) {
            setCommentsOpen(false);
            return;
        }
        setCommentsOpen(true);
        if (comments.length > 0) return; // Already loaded

        setLoadingComments(true);
        try {
            const res = await fetch(`/api/posts/${post.id}/comments`);
            if (res.ok) {
                setComments(await res.json());
            }
        } catch (e) { } finally {
            setLoadingComments(false);
        }
    };

    const submitComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const res = await fetch(`/api/posts/${post.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: commentText })
            });

            if (res.ok) {
                const newComment = await res.json();
                setComments([...comments, newComment]);
                setCommentText("");
            }
        } catch (e) { }
    };

    const mediaAttachments = post.attachments?.filter((att: any) => att.type === "image") || [];
    const fileAttachments = post.attachments?.filter((att: any) => att.type !== "image") || [];

    return (
        <Card className="mb-4">
            <CardHeader className="flex flex-row items-center gap-4 p-4 pb-2">
                <Avatar>
                    <AvatarImage src={post.user.image} />
                    <AvatarFallback>{post.user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <Link href={`/profile/${post.user.id}`} className="font-semibold hover:underline">
                            {post.user.name}
                        </Link>
                        {post.community && (
                            <span className="text-muted-foreground text-sm">
                                in <Link href={`/community/${post.community.id}`} className="hover:underline font-medium text-foreground">{post.community.name}</Link>
                            </span>
                        )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </span>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto">
                    <MoreHorizontal className="w-4 h-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-4 py-2 space-y-3">
                <p className="whitespace-pre-wrap">{post.content}</p>



                {/* Image Gallery */}
                {mediaAttachments.length > 0 && (
                    <div className="relative group overflow-hidden rounded-md bg-black/5 border aspect-video flex items-center justify-center">
                        {/* Image */}
                        <div
                            className="w-full h-full flex transition-transform duration-300 ease-out cursor-pointer"
                            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                            onClick={() => setIsViewerOpen(true)}
                        >
                            {mediaAttachments.map((att: any, index: number) => (
                                <div key={att.id || index} className="min-w-full h-full relative flex items-center justify-center bg-black">
                                    <img
                                        src={att.url}
                                        alt={`Post image ${index + 1}`}
                                        className="max-h-[500px] w-auto h-full object-contain"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Navigation Arrows */}
                        {mediaAttachments.length > 1 && (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setCurrentImageIndex(prev => prev === 0 ? mediaAttachments.length - 1 : prev - 1);
                                    }}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setCurrentImageIndex(prev => prev === mediaAttachments.length - 1 ? 0 : prev + 1);
                                    }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>

                                {/* Indicators */}
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                    {mediaAttachments.map((_: any, i: number) => (
                                        <div
                                            key={i}
                                            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* File Attachments */}
                {fileAttachments.length > 0 && (
                    <div className="space-y-2">
                        {fileAttachments.map((att: any) => (
                            <a
                                key={att.id}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors border"
                            >
                                <div className="bg-background p-2 rounded-md shadow-sm">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium truncate">{att.name || "Attached File"}</p>
                                    <p className="text-xs text-muted-foreground">{att.size ? `${Math.round(att.size / 1024)} KB` : "Document"}</p>
                                </div>
                                <Download className="w-4 h-4 text-muted-foreground" />
                            </a>
                        ))}
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-2 flex flex-col items-stretch">
                <div className="flex items-center justify-between w-full border-t pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("flex-1 gap-2", liked && "text-red-500 hover:text-red-600")}
                        onClick={toggleLike}
                    >
                        <Heart className={cn("w-4 h-4", liked && "fill-current")} />
                        {likeCount > 0 && likeCount}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 gap-2" onClick={loadComments}>
                        <MessageSquare className="w-4 h-4" />
                        {commentCount > 0 && commentCount}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 gap-2">
                        <Share2 className="w-4 h-4" />
                    </Button>
                </div>

                {commentsOpen && (
                    <div className="w-full mt-4 space-y-4">
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                            {loadingComments && <p className="text-center text-xs text-muted-foreground">Loading...</p>}

                            {comments.filter(c => !c.parentId).map((comment) => (
                                <CommentItem
                                    key={comment.id}
                                    comment={comment}
                                    currentUserId={currentUserId}
                                    replies={comments.filter(c => c.parentId === comment.id)}
                                    onReply={async (parentId, content) => {
                                        try {
                                            const res = await fetch(`/api/posts/${post.id}/comments`, {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ content, parentId })
                                            });
                                            if (res.ok) {
                                                const newComment = await res.json();
                                                // Mutate local state
                                                setComments([...comments, newComment]);
                                            }
                                        } catch (e) { }
                                    }}
                                    onDelete={async (commentId) => {
                                        if (!confirm("Are you sure?")) return;
                                        try {
                                            await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
                                            setComments(comments.filter(c => c.id !== commentId));
                                        } catch (e) { }
                                    }}
                                    onUpdate={async (commentId, content) => {
                                        try {
                                            const res = await fetch(`/api/comments/${commentId}`, {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ content })
                                            });
                                            if (res.ok) {
                                                const updated = await res.json();
                                                setComments(comments.map(c => c.id === commentId ? updated : c));
                                            }
                                        } catch (e) { }
                                    }}
                                />
                            ))}
                        </div>
                        <form onSubmit={submitComment} className="flex gap-2">
                            <Input
                                placeholder="Write a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" size="sm" disabled={!commentText.trim()}>Post</Button>
                        </form>
                    </div>
                )}
            </CardFooter>

            <ImageViewer
                images={mediaAttachments}
                initialIndex={currentImageIndex}
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
            />
        </Card>
    );
}
