"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Send, X, Image as ImageIcon, FileText, Video } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/components/providers/socket-provider";

interface ChatInputProps {
    socket?: any;
    apiUrl: string;
    query: Record<string, any>;
    name: string;
    type: "conversation" | "channel";
}

const formSchema = z.object({
    content: z.string(),
});

export const ChatInput = ({
    socket,
    apiUrl,
    query,
    name,
    type,
    member
}: ChatInputProps & { member: any }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            content: "",
        },
    });

    const { isConnected } = useSocket();
    const isLoading = form.formState.isSubmitting || uploading;

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB");
            return;
        }

        setSelectedFile(file);

        // Create preview for images and videos
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            const url = URL.createObjectURL(file);
            setFilePreview(url);
        } else {
            setFilePreview(null);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            // Require either content or file
            if (!values.content.trim() && !selectedFile) {
                return;
            }

            let fileUrl = null;

            // Upload file first if selected
            if (selectedFile) {
                setUploading(true);
                const formData = new FormData();
                formData.append('file', selectedFile);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!uploadRes.ok) {
                    setUploading(false);
                    throw new Error('File upload failed');
                }

                const uploadData = await uploadRes.json();
                fileUrl = uploadData.url;
                setUploading(false);
            }

            const payload = {
                content: values.content.trim() || (selectedFile ? `Sent a file: ${selectedFile.name}` : ''),
                senderId: (member as any)?.id,
                fileUrl: fileUrl,
                fileType: selectedFile?.type || null,
                fileName: selectedFile?.name || null,
                ...query
            };

            if (socket) {
                socket.emit("send-message", payload);
                form.reset();
                clearFile();
            } else {
                await fetch("/api/messages", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                form.reset();
                clearFile();
            }
        } catch (error) {
            console.error("ChatInput Error", error);
            toast.error("Failed to send message");
            setUploading(false);
        }
    }

    return (
        <div className="border-t bg-card">
            {/* File Preview */}
            {selectedFile && (
                <div className="p-3 border-b bg-muted/50">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            {selectedFile.type.startsWith('image/') && filePreview ? (
                                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-border">
                                    <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                            ) : selectedFile.type.startsWith('video/') && filePreview ? (
                                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-border">
                                    <video src={filePreview} className="w-full h-full object-cover" />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-lg border-2 border-border bg-muted flex items-center justify-center">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(selectedFile.size / 1024).toFixed(2)} KB
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearFile}
                            className="shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="relative p-3 sm:p-4">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 z-10"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isLoading}
                                        >
                                            <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground hover:text-foreground transition" />
                                        </Button>
                                        <Input
                                            disabled={isLoading}
                                            className="px-12 sm:px-14 py-5 sm:py-6 bg-muted/50 border-none ring-0 focus-visible:ring-1 focus-visible:ring-ring text-sm sm:text-base"
                                            placeholder={uploading ? "Uploading..." : `Message ${type === "conversation" ? name : "#" + name}`}
                                            {...field}
                                        />
                                        <Button
                                            disabled={isLoading || (!field.value && !selectedFile)}
                                            size="icon"
                                            variant="ghost"
                                            className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2"
                                        >
                                            <Send className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground hover:text-primary transition" />
                                        </Button>
                                    </div>
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </form>
            </Form>
        </div>
    )
}
