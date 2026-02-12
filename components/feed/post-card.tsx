"use client";

import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Heart, MessageSquare, Share2, MoreHorizontal, FileText, Download, X, ChevronLeft, ChevronRight, Video, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CommentItem } from "./comment-item";
import { ImageViewer } from "@/components/ui/image-viewer";
import { useToast } from "@/hooks/use-toast";
import { FilePreview } from "@/components/file-preview";
import { Loader2, LayoutDashboard } from "lucide-react";
import { VideoPlayer } from "@/components/ui/video-player";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LikersDialog } from "./likers-dialog";

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
    const { toast } = useToast();
    const [isSavingInProgress, setIsSavingInProgress] = useState<string | null>(null);
    const [isDeleted, setIsDeleted] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(post.status || "published");
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [isLikersOpen, setIsLikersOpen] = useState(false);

    const handleStatusChange = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/posts/${post.id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                setCurrentStatus(newStatus);
                toast({ title: `Post ${newStatus === "archived" ? "archived" : (newStatus === "draft" ? "saved as draft" : "published")}` });
                // Note: In a real app, we might want to trigger a refresh of the feed
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to update post status", variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this post?")) return;
        try {
            const res = await fetch(`/api/posts/${post.id}/status`, {
                method: "DELETE"
            });

            if (res.ok) {
                setIsDeleted(true);
                toast({ title: "Post deleted" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete post", variant: "destructive" });
        }
    };

    if (isDeleted) return null;
    if (currentStatus === "archived" && !window.location.pathname.includes("/profile")) return null;
    if (currentStatus === "draft" && !window.location.pathname.includes("/profile")) return null;

    // Sync state with props when they change (real-time updates from FeedView)
    useEffect(() => {
        setLiked(post.likes && post.likes.length > 0);
        setLikeCount(post._count.likes);
        setCommentCount(post._count.comments);
    }, [post.likes, post._count.likes, post._count.comments]);

    // Track view automatically on mount
    const viewCounted = useRef(false);
    useEffect(() => {
        if (!viewCounted.current && post.id) {
            fetch(`/api/posts/${post.id}/view`, { method: "PATCH" })
                .catch(() => { });
            viewCounted.current = true;
        }
    }, [post.id]);

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

    const handleSaveToDrive = async (att: any) => {
        try {
            setIsSavingInProgress(att.id);
            const response = await fetch('/api/drive/save-from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: att.url,
                    name: att.name || "downloaded-file"
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save to Drive');
            }

            toast({
                title: 'Saved to Drive',
                description: `"${att.name || 'File'}" has been saved to your personal Drive.`,
            });
        } catch (e: any) {
            console.error("Save to Drive failed", e);
            toast({
                title: 'Error',
                description: e.message || 'Failed to save file to Drive.',
                variant: 'destructive',
            });
        } finally {
            setIsSavingInProgress(null);
        }
    };

    const handlePreview = (att: any) => {
        const isPDF = att.mimeType === 'application/pdf' || att.name?.toLowerCase().endsWith('.pdf');
        setSelectedFile({
            id: att.id || att.url,
            name: att.name || "File",
            url: att.url,
            size: att.size || 0,
            type: isPDF ? 'application/pdf' : 'application/octet-stream'
        });
        setIsPreviewOpen(true);
    };

    const mediaAttachments = post.attachments?.filter((att: any) => att.type === "image") || [];
    const videoAttachments = post.attachments?.filter((att: any) => att.type === "video") || [];
    const fileAttachments = post.attachments?.filter((att: any) => att.type !== "image" && att.type !== "video") || [];

    return (
        <Card className="mb-2 sm:mb-4 rounded-none sm:rounded-xl border-x-0 sm:border-x">
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
                <div className="ml-auto">
                    {currentUserId === post.user.id && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleStatusChange(post.status === "archived" ? "published" : "archived")}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    {post.status === "archived" ? "Restore" : "Archive"}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(post.status === "draft" ? "published" : "draft")}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    {post.status === "draft" ? "Publish" : "Set as Draft"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600"
                                    onClick={handleDelete}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 py-2 space-y-3">
                <p className="whitespace-pre-wrap">{post.content}</p>



                {/* Image Gallery */}
                {mediaAttachments.length > 0 && (
                    <div className="relative group overflow-hidden rounded-md bg-muted/30 border flex flex-col">
                        {/* Image */}
                        <div
                            className="w-full flex transition-transform duration-300 ease-out cursor-pointer"
                            style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}
                            onClick={() => setIsViewerOpen(true)}
                        >
                            {mediaAttachments.map((att: any, index: number) => (
                                <div key={att.id || index} className="min-w-full relative flex items-center justify-center">
                                    <img
                                        src={att.url}
                                        alt={`Post image ${index + 1}`}
                                        className="w-full h-auto object-contain"
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

                {/* Video Playback */}
                {videoAttachments.length > 0 && (
                    <div className="space-y-3 mb-3">
                        {videoAttachments.map((att: any) => (
                            <VideoPlayer
                                key={att.id}
                                src={att.url}
                                className="w-full border shadow-sm aspect-video max-h-[400px]"
                            />
                        ))}
                    </div>
                )}

                {/* File Attachments */}
                {fileAttachments.length > 0 && (
                    <div className="space-y-2">
                        {fileAttachments.map((att: any) => {
                            const isPDF = att.mimeType === 'application/pdf' || att.name?.toLowerCase().endsWith('.pdf');
                            // In the post API, attachments might not have a direct fileId if they were external URLs,
                            // but if they were uploaded through the platform, we can try to guess or use a specific proxy.
                            // For now, let's assume if it has a 'url' that looks like our internal storage, we can use it.

                            return (
                                <button
                                    key={att.id}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handlePreview(att);
                                    }}
                                    disabled={!!isSavingInProgress}
                                    className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors border text-left group disabled:opacity-50"
                                >
                                    <div className="relative bg-background rounded-md shadow-sm group-hover:bg-accent transition-colors overflow-hidden h-20 w-20 flex items-center justify-center shrink-0">
                                        {isPDF ? (
                                            <img
                                                src={att.url.includes('/api/drive/files')
                                                    ? `${att.url}${att.url.includes('?') ? '&' : '?'}thumbnail=true`
                                                    : `/api/media/thumbnail?url=${encodeURIComponent(att.url)}`
                                                }
                                                alt={att.name}
                                                className="h-full w-full object-cover"
                                                onError={(e) => {
                                                    // Fallback to icon if thumbnail fails
                                                    (e.target as any).style.display = 'none';
                                                    if ((e.target as any).nextSibling) {
                                                        (e.target as any).nextSibling.classList.remove('hidden');
                                                        (e.target as any).nextSibling.classList.add('flex');
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        <div className={cn("flex items-center justify-center w-full h-full", isPDF ? "hidden" : "flex")}>
                                            {att.type === 'video' ? (
                                                <Video className="w-8 h-8 text-purple-500" />
                                            ) : (
                                                <FileText className="w-8 h-8 text-blue-500" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-medium truncate">{att.name || "Attached File"}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded leading-none">
                                                {att.type === 'video' ? 'Video' : (isPDF ? 'PDF' : 'File')}
                                            </span>
                                            <p className="text-xs text-muted-foreground">{att.size ? `${Math.round(att.size / 1024)} KB` : "Document"}</p>
                                        </div>
                                    </div>
                                    {isSavingInProgress === att.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                    ) : (
                                        <div className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/5 px-2 py-1 rounded-full transition-colors group-hover:bg-primary/10 shrink-0">
                                            <span className="hidden sm:inline">Save to Drive</span>
                                            <Download className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-2 flex flex-col items-stretch">
                <div className="flex items-center justify-between w-full border-t pt-2">
                    <div className="flex-1 flex items-center justify-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("gap-2 px-2", liked && "text-red-500 hover:text-red-600")}
                            onClick={toggleLike}
                        >
                            <Heart className={cn("w-4 h-4", liked && "fill-current")} />
                        </Button>
                        {likeCount > 0 && (
                            <button
                                onClick={() => setIsLikersOpen(true)}
                                className="text-sm font-medium hover:underline text-muted-foreground ml-1"
                            >
                                {likeCount}
                            </button>
                        )}
                    </div>
                    <Button variant="ghost" size="sm" className="flex-1 gap-2" onClick={loadComments}>
                        <MessageSquare className="w-4 h-4" />
                        {commentCount > 0 && commentCount}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1 gap-2">
                        <Share2 className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-1.5 px-3 text-muted-foreground">
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-medium">{post.viewCount || 0}</span>
                    </div>
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

            {selectedFile && (
                <FilePreview
                    file={selectedFile}
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                />
            )}

            <LikersDialog
                isOpen={isLikersOpen}
                onClose={() => setIsLikersOpen(false)}
                apiUrl={`/api/posts/${post.id}/like`}
            />
        </Card>
    );
}
