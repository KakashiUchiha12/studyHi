"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface CreatePostProps {
    communityId?: string;
    currentUser: any;
    onPostCreated: (post: any) => void;
}

import { UploadButton } from "@/lib/uploadthing";
import { X, FileText, Image as ImageIcon } from "lucide-react";

export function CreatePost({ communityId, currentUser, onPostCreated }: CreatePostProps) {
    const [content, setContent] = useState("");
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim() && attachments.length === 0) return;
        setLoading(true);
        try {
            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, communityId, attachments, isAnnouncement })
            });

            if (res.ok) {
                const newPost = await res.json();
                const augmentedPost = {
                    ...newPost,
                    user: currentUser,
                    _count: { comments: 0, likes: 0 },
                    likes: [],
                    attachments: attachments // Optimistic attachment update if needed, though API returns them
                };
                onPostCreated(augmentedPost);
                setContent("");
                setAttachments([]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <Card className="mb-6">
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <Avatar>
                        <AvatarImage src={currentUser?.image} />
                        <AvatarFallback>{currentUser?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                        <Textarea
                            placeholder={communityId ? "Post to this community..." : "What's on your mind?"}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[80px] border-none focus-visible:ring-0 px-0 resize-none text-base"
                        />

                        {/* Attachments Preview */}
                        {attachments.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto py-2">
                                {attachments.map((att, i) => (
                                    <div key={i} className="relative group shrink-0">
                                        {att.type === "image" ? (
                                            <img src={att.url} alt="Attachment" className="h-20 w-20 object-cover rounded-md border" />
                                        ) : (
                                            <div className="h-20 w-20 bg-slate-100 flex flex-col items-center justify-center rounded-md border text-xs text-muted-foreground p-1 text-center truncate">
                                                <FileText className="h-6 w-6 mb-1" />
                                                <span className="w-full truncate">{att.name}</span>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => removeAttachment(i)}
                                            className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-sm hover:bg-rose-600 transition"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center border-t pt-2">
                            <div className="flex items-center">
                                <UploadButton
                                    endpoint="postAttachment"
                                    onClientUploadComplete={(res) => {
                                        // console.log("Files: ", res);
                                        if (res) {
                                            const newAttachments = res.map(file => ({
                                                url: file.url,
                                                name: file.name,
                                                size: file.size,
                                                type: file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "image" : "file"
                                            }));
                                            setAttachments(prev => [...prev, ...newAttachments]);
                                        }
                                    }}
                                    onUploadError={(error: Error) => {
                                        console.error(`ERROR! ${error.message}`);
                                    }}
                                    appearance={{
                                        button: "bg-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2 w-auto h-8 text-xs font-normal",
                                        allowedContent: "hidden"
                                    }}
                                    content={{
                                        button: (
                                            <div className="flex items-center gap-1">
                                                <ImageIcon className="w-4 h-4" />
                                                <span>Add Media</span>
                                            </div>
                                        )
                                    }}
                                />
                            </div>
                            <Button size="sm" onClick={handleSubmit} disabled={loading || (!content.trim() && attachments.length === 0)}>
                                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Post
                            </Button>
                        </div>

                        {communityId && (
                            <div className="flex items-center gap-2 pt-2">
                                <label className="text-xs text-muted-foreground flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isAnnouncement}
                                        onChange={(e) => setIsAnnouncement(e.target.checked)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    Post as Announcement
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
