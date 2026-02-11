"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, MoreHorizontal, Pencil, Trash } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { LikersDialog } from "./likers-dialog";

interface CommentItemProps {
    comment: any;
    currentUserId?: string;
    onReply: (parentId: string, content: string) => Promise<void>;
    onDelete: (commentId: string) => Promise<void>;
    onUpdate: (commentId: string, content: string) => Promise<void>;
    replies?: any[];
}

export const CommentItem = ({
    comment,
    currentUserId,
    onReply,
    onDelete,
    onUpdate,
    replies = []
}: CommentItemProps) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(comment.content);

    const [liked, setLiked] = useState<boolean>(comment.likes && comment.likes.length > 0);
    const [likeCount, setLikeCount] = useState<number>(comment._count?.likes || 0);
    const [isLikersOpen, setIsLikersOpen] = useState(false);

    const isOwner = currentUserId === comment.userId;

    const handleLike = async () => {
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(newLiked ? likeCount + 1 : likeCount - 1);

        try {
            await fetch(`/api/comments/${comment.id}/like`, { method: "POST" });
        } catch (error) {
            setLiked(!newLiked);
            setLikeCount(likeCount);
        }
    };

    const handleSubmitReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        await onReply(comment.id, replyContent);
        setReplyContent("");
        setIsReplying(false);
    };

    const handleUpdate = async () => {
        if (!editContent.trim()) return;
        await onUpdate(comment.id, editContent);
        setIsEditing(false);
    }

    return (
        <div className="flex gap-3 text-sm group">
            <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarImage src={comment.user.image} />
                <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                    <div className="bg-muted p-3 rounded-lg flex-1 mr-2">
                        <div className="font-semibold text-xs mb-1 flex items-center justify-between">
                            {comment.user.name}
                            <span className="text-muted-foreground font-normal text-[10px]">
                                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                            </span>
                        </div>

                        {isEditing ? (
                            <div className="space-y-2">
                                <Input
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="bg-white dark:bg-zinc-800"
                                />
                                <div className="flex gap-2">
                                    <Button size="sm" className="h-6 px-2 text-xs" onClick={handleUpdate}>Save</Button>
                                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setIsEditing(false)}>Cancel</Button>
                                </div>
                            </div>
                        ) : (
                            <p>{comment.content}</p>
                        )}
                    </div>

                    {isOwner && !isEditing && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreHorizontal className="w-3 h-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-500" onClick={() => onDelete(comment.id)}>
                                    <Trash className="w-4 h-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                <div className="flex items-center gap-4 text-muted-foreground text-xs px-1">
                    <div className="flex items-center gap-1">
                        <button
                            className={cn("flex items-center gap-1 hover:text-red-500 transition-colors", liked && "text-red-500")}
                            onClick={handleLike}
                        >
                            <Heart className={cn("w-3 h-3", liked && "fill-current")} />
                            Like
                        </button>
                        {likeCount > 0 && (
                            <button
                                onClick={() => setIsLikersOpen(true)}
                                className="hover:underline"
                            >
                                {likeCount}
                            </button>
                        )}
                    </div>
                    <button
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                        onClick={() => setIsReplying(!isReplying)}
                    >
                        Reply
                    </button>
                </div>

                {isReplying && (
                    <form onSubmit={handleSubmitReply} className="flex gap-2 mt-2">
                        <Input
                            placeholder={`Reply to ${comment.user.name}...`}
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            className="h-8 text-xs"
                            autoFocus
                        />
                        <Button type="submit" size="sm" className="h-8 text-xs">Reply</Button>
                    </form>
                )}

                {/* Nested Replies */}
                {replies.length > 0 && (
                    <div className="pl-4 border-l-2 border-muted mt-2 space-y-4">
                        {replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                currentUserId={currentUserId}
                                onReply={onReply}
                                onDelete={onDelete}
                                onUpdate={onUpdate}
                                replies={[]} // Max 1 level nesting for UI simplicity, or pass nested if needed
                            />
                        ))}
                    </div>
                )}
            </div>
            <LikersDialog
                isOpen={isLikersOpen}
                onClose={() => setIsLikersOpen(false)}
                apiUrl={`/api/comments/${comment.id}/like`}
            />
        </div>
    );
}
