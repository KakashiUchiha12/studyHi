"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X, FileText, Image as ImageIcon, Megaphone, Video, Paperclip } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface CreatePostProps {
    communityId?: string;
    currentUser: any;
    onPostCreated: (post: any) => void;
    isAnnouncementMode?: boolean; // If true, forces 'isAnnouncement' to true
}

interface UploadingFile {
    name: string;
    progress: number;
}

export function CreatePost({ communityId, currentUser, onPostCreated, isAnnouncementMode }: CreatePostProps) {
    const [content, setContent] = useState("");
    const [attachments, setAttachments] = useState<any[]>([]);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [isAnnouncement, setIsAnnouncement] = useState(isAnnouncementMode || false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim() && attachments.length === 0) return;
        setLoading(true);
        try {
            // Force announcement if in mode
            const finalIsAnnouncement = isAnnouncementMode ? true : isAnnouncement;

            const res = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content,
                    communityId,
                    attachments,
                    isAnnouncement: finalIsAnnouncement
                })
            });

            if (res.ok) {
                const newPost = await res.json();
                const augmentedPost = {
                    ...newPost,
                    user: currentUser,
                    _count: { comments: 0, likes: 0 },
                    likes: [],
                    attachments: newPost.attachments || attachments
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

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);

            for (const file of files) {
                // Start tracking upload
                setUploadingFiles(prev => [...prev, { name: file.name, progress: 0 }]);

                // Simulate progress
                const progressInterval = setInterval(() => {
                    setUploadingFiles(prev => prev.map(f =>
                        f.name === file.name ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
                    ));
                }, 100);

                const formData = new FormData();
                formData.append("file", file);

                try {
                    const res = await fetch("/api/upload", {
                        method: "POST",
                        body: formData
                    });

                    if (res.ok) {
                        const data = await res.json();
                        // Complete progress
                        clearInterval(progressInterval);
                        setUploadingFiles(prev => prev.filter(f => f.name !== file.name));

                        let type = "file";
                        if (file.type.startsWith("image/")) type = "image";
                        else if (file.type.startsWith("video/")) type = "video";
                        else if (file.type === "application/pdf") type = "pdf";

                        setAttachments(prev => [...prev, {
                            url: data.url,
                            name: file.name,
                            size: file.size,
                            type: type
                        }]);
                    }
                } catch (error) {
                    console.error("Upload failed", error);
                    clearInterval(progressInterval);
                    setUploadingFiles(prev => prev.filter(f => f.name !== file.name));
                }
            }
        }
    };

    return (
        <Card className={cn(
            "mb-2 sm:mb-6 rounded-none sm:rounded-xl border-x-0 sm:border-x",
            isAnnouncementMode ? "border-blue-200 bg-blue-50/30" : ""
        )}>
            <CardContent className="p-4">
                <div className="flex gap-4">
                    <Avatar>
                        <AvatarImage src={currentUser?.image} />
                        <AvatarFallback>{currentUser?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                        <Textarea
                            placeholder={isAnnouncementMode ? "Post a new announcement..." : (communityId ? "Post to this community..." : "What's on your mind?")}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="min-h-[80px] border-none focus-visible:ring-0 px-0 resize-none text-base bg-transparent"
                        />

                        {/* Attachments Preview */}
                        {attachments.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto py-2">
                                {attachments.map((att, i) => (
                                    <div key={i} className="relative group shrink-0">
                                        {att.type === "image" ? (
                                            <img src={att.url} alt="Attachment" className="h-20 w-20 object-cover rounded-md border" />
                                        ) : (
                                            <div className="h-20 w-20 bg-slate-100 flex flex-col items-center justify-center rounded-md border text-[10px] text-muted-foreground p-1 text-center truncate">
                                                {att.type === "video" ? (
                                                    <Video className="h-6 w-6 mb-1 text-purple-500" />
                                                ) : att.type === "pdf" ? (
                                                    <FileText className="h-6 w-6 mb-1 text-red-500" />
                                                ) : (
                                                    <FileText className="h-6 w-6 mb-1 text-blue-500" />
                                                )}
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

                        {/* Upload Progress */}
                        {uploadingFiles.length > 0 && (
                            <div className="space-y-2 py-2">
                                {uploadingFiles.map((file, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Uploading {file.name}...</span>
                                            <span>{file.progress}%</span>
                                        </div>
                                        <Progress value={file.progress} className="h-1" />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-between items-center border-t pt-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="file"
                                    id="post-media-upload"
                                    multiple
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                />
                                <input
                                    type="file"
                                    id="post-attachment-upload"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2 h-8 px-2"
                                    onClick={() => document.getElementById('post-media-upload')?.click()}
                                >
                                    <ImageIcon className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs hidden md:inline">Add Media</span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-foreground hover:bg-muted/50 gap-2 h-8 px-2"
                                    onClick={() => document.getElementById('post-attachment-upload')?.click()}
                                >
                                    <Paperclip className="w-4 h-4 text-blue-500" />
                                    <span className="text-xs hidden md:inline">Add Attachment</span>
                                </Button>
                                {isAnnouncementMode && (
                                    <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                                        <Megaphone className="w-3 h-3" /> Announcement
                                    </span>
                                )}
                            </div>
                            <Button size="sm" onClick={handleSubmit} disabled={loading || (!content.trim() && attachments.length === 0) || uploadingFiles.length > 0}>
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Posting...
                                    </>
                                ) : (
                                    "Post"
                                )}
                            </Button>
                        </div>

                        {!isAnnouncementMode && communityId && (
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
