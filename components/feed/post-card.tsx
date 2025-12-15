"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, MessageSquare, Share2, MoreHorizontal, FileText, Download, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
                    <div className={cn("grid gap-2",
                        mediaAttachments.length === 1 ? "grid-cols-1" :
                            mediaAttachments.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"
                    )}>
                        {mediaAttachments.map((att: any) => (
                            <div key={att.id} className="relative aspect-square">
                                <img
                                    src={att.url}
                                    alt="Post image"
                                    className="absolute inset-0 w-full h-full object-cover rounded-md border"
                                />
                            </div>
                        ))}
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
                        {post._count.comments > 0 && post._count.comments}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 gap-2">
                        <Share2 className="w-4 h-4" />
                    </Button>
                </div>

                {commentsOpen && (
                    <div className="w-full mt-4 space-y-4">
                        <div className="space-y-4 max-h-60 overflow-y-auto">
                            {loadingComments && <p className="text-center text-xs text-muted-foreground">Loading...</p>}
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 text-sm">
                                    <Avatar className="w-8 h-8">
                                        <AvatarImage src={comment.user.image} />
                                        <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="bg-muted p-2 rounded-lg flex-1">
                                        <div className="font-semibold text-xs mb-1">{comment.user.name}</div>
                                        <p>{comment.content}</p>
                                    </div>
                                </div>
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
        </Card>
    );
}
