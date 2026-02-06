"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { Send, Paperclip, Loader2, File, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from "react-markdown";
import { format } from "date-fns";
import { useEffect } from "react";
import { pusherClient } from "@/lib/pusher";

interface Message {
    id: string;
    content: string;
    senderId: string;
    createdAt: string;
    sender: {
        id: string;
        name: string;
        image: string | null;
    };
}

interface ChatInterfaceProps {
    channelId: string;
    channelName: string;
}

export function ChatInterface({ channelId, channelName }: ChatInterfaceProps) {
    const { data: session } = useSession();
    const [newMessage, setNewMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch messages with React Query - infinite scroll for older messages
    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage
    } = useInfiniteQuery({
        queryKey: ['messages', channelId],
        queryFn: async ({ pageParam }) => {
            const params = new URLSearchParams();
            if (pageParam) params.append("cursor", pageParam);

            const res = await fetch(`/api/channels/${channelId}/messages?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch messages');
            return res.json();
        },
        getNextPageParam: (lastPage) => {
            // If we got a full page (50 messages), there might be more older messages
            if (lastPage && lastPage.length === 50) {
                return lastPage[0].id; // First message (oldest in this batch) is cursor for next page
            }
            return undefined;
        },
        initialPageParam: undefined,
        refetchInterval: 15000, // Auto-refresh every 15s
        staleTime: 10000,
    });

    // Subscribe to Pusher channel
    useEffect(() => {
        pusherClient.subscribe(`chat-${channelId}`);

        const messageHandler = (message: Message) => {
            queryClient.setQueryData(['messages', channelId], (old: any) => {
                if (!old) return { pages: [[message]], pageParams: [undefined] };

                // Add to the first page (newest messages are at the end of the flattened array, 
                // but in the pages structure, usually page[0] is the newest fetch depending on implementation.
                // Our flatMap acts on data.pages. 
                // Let's look at how we process it: const messages = data?.pages.flatMap(page => page).reverse() ?? [];

                // InfiniteQuery pages are typically [newest_batch, older_batch, ...] if we prepend.
                // But here we're fetching with cursor. 

                // Simplest approach for optimistic UI + real-time:
                // We just need to ensure this message is in the cache.
                // React Query's infinite query data structure is { pages: [Array(50), Array(50)], pageParams: [...] }

                const newPages = [...old.pages];

                // If the message already exists (from optimistic update), don't add it again
                // We might need a temp ID for optimistic updates to handle this perfectly, 
                // but for now let's just check if ID matches (if optimistic update used real ID? No, it doesn't know it yet).
                // Optimistic updates usually don't have the real DB ID. 
                // However, since we are using pusher, we get the real DB message. 

                // Let's just prepend to the first page if we want it to show up as newest.
                // Since we reverse() the flat list for display, adding to the START of the first page array 
                // means it will be at the END of the reversed array? No.
                // flatMap: [p1, p2] -> [p1_items, p2_items]
                // reverse: [p2_items_reversed, p1_items_reversed] ... wait.
                // const messages = data?.pages.flatMap(page => page).reverse() ?? [];
                // API returns: orderBy createdAt desc. So page[0] has NEWEST messages.
                // page[0] = [Msg_Newest, Msg_Older, ...]
                // flatMap -> [Msg_Newest, Msg_Older, ..., Msg_EvenOlder]
                // reverse -> [Msg_EvenOlder, ..., Msg_Older, Msg_Newest]

                // So to add a NEW message, we should UNSHIFT it into page[0].
                // page[0] becomes [Msg_BrandNew, Msg_Newest, ...]

                if (newPages.length > 0) {
                    // Check if message already exists in the first page (to avoid duplication if re-fetching or optimistic)
                    const exists = newPages[0].some((m: Message) => m.id === message.id);
                    if (!exists) {
                        newPages[0] = [message, ...newPages[0]];
                    }
                } else {
                    newPages.push([message]);
                }

                return {
                    ...old,
                    pages: newPages,
                };
            });

            // Also scroll to bottom if near bottom? Or just notify?
            // For now, let's just scroll if reasonable.
            setTimeout(scrollToBottom, 100);
        };

        pusherClient.bind('new-message', messageHandler);

        return () => {
            pusherClient.unsubscribe(`chat-${channelId}`);
            pusherClient.unbind('new-message', messageHandler);
        };
    }, [channelId, queryClient]);

    // Flatten all pages and reverse to show newest at bottom
    const messages = data?.pages.flatMap(page => page).reverse() ?? [];

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: async (content: string) => {
            const res = await fetch(`/api/channels/${channelId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
            });
            if (!res.ok) throw new Error("Failed to send");
            return res.json();
        },
        onSuccess: (sentMessage) => {
            // Update cache - InfiniteQuery structure
            queryClient.setQueryData(['messages', channelId], (old: any) => {
                if (!old) return { pages: [[sentMessage]], pageParams: [undefined] };
                const newPages = [...old.pages];
                if (newPages.length > 0) {
                    const exists = newPages[0].some((m: Message) => m.id === sentMessage.id);
                    if (!exists) {
                        newPages[0] = [sentMessage, ...newPages[0]];
                    }
                } else {
                    newPages.push([sentMessage]);
                }
                return { ...old, pages: newPages };
            });

            setNewMessage("");
            setTimeout(scrollToBottom, 100);
        },
        onError: () => {
            toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
        }
    });

    const scrollToBottom = () => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!newMessage.trim() && !isUploading) || sendMessageMutation.isPending) return;
        sendMessageMutation.mutate(newMessage);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsUploading(true);
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append("file", file);

            try {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) throw new Error("Upload failed");

                const data = await res.json();

                // Determine file type icon/text logic for markdown
                const isImage = file.type.startsWith("image/");
                const markdownLink = isImage
                    ? `\n![${file.name}](${data.url})`
                    : `\n[📎 ${file.name}](${data.url})`;

                setNewMessage(prev => prev + markdownLink);
                toast({ title: "File uploaded", description: "Attached to message" });
            } catch (error) {
                toast({ title: "Error", description: "Upload failed", variant: "destructive" });
            } finally {
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }
        }
    };

    const renderMessageContent = (content: string) => {
        // Custom renderers could be added here for specific styling
        return (
            <div className="prose prose-sm dark:prose-invert break-words max-w-none">
                <ReactMarkdown
                    components={{
                        a: ({ node, ...props }) => <a {...props} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer" />,
                        img: ({ node, ...props }) => <img {...props} className="rounded-lg max-h-60 max-w-full my-2" />
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        );
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-[500px]"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b bg-gray-50/40 font-semibold flex items-center gap-2">
                <span className="text-muted-foreground">#</span> {channelName}
            </div>

            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-6">
                    {/* Load older messages button */}
                    {hasNextPage && (
                        <div className="flex justify-center pb-4">
                            <Button
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                            >
                                {isFetchingNextPage ? (
                                    <>
                                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                                        Loading older messages...
                                    </>
                                ) : (
                                    'Load Older Messages'
                                )}
                            </Button>
                        </div>
                    )}

                    {messages.map((message, index) => {
                        const isMe = message.senderId === (session?.user as any)?.id;

                        return (
                            <div key={message.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                                <Avatar className="w-8 h-8 mt-1">
                                    <AvatarImage src={message.sender.image || ""} />
                                    <AvatarFallback>{message.sender.name[0]?.toUpperCase()}</AvatarFallback>
                                </Avatar>

                                <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-semibold text-foreground">
                                            {message.sender.name}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {format(new Date(message.createdAt), "p")}
                                        </span>
                                    </div>
                                    <div className={`px-4 py-2 rounded-2xl ${isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"}`}>
                                        {renderMessageContent(message.content)}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div className="h-4" /> {/* Spacer */}
                </div>
            </ScrollArea>

            <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50/40 flex items-end gap-2">
                <div className="flex-1 relative">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="pr-10"
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                </div>
                <Button type="submit" disabled={sendMessageMutation.isPending || (!newMessage.trim())} size="icon">
                    <Send className="w-4 h-4" />
                </Button>
            </form>
        </div>
    );
}
