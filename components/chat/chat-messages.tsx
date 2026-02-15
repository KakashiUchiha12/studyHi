"use client";

import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { format } from "date-fns";
import { Download, X, Maximize2, FileText, File, Loader2 } from "lucide-react";
import Link from "next/link";
import { VideoPlayer } from "@/components/ui/video-player";
import { notificationManager } from "@/lib/notifications";

interface ChatMessagesProps {
    name: string;
    member: any; // Current member
    chatId: string;
    apiUrl: string;
    socketUrl: string;
    socket?: any; // Made optional
    paramKey: "channelId" | "conversationId";
    paramValue: string;
    type: "channel" | "conversation";
}

export const ChatMessages = ({
    name,
    member,
    chatId,
    apiUrl,
    socketUrl,
    socket,
    paramKey,
    paramValue,
    type,
}: ChatMessagesProps) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [viewerMedia, setViewerMedia] = useState<{ url: string, type: string, name: string } | null>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [nextCursor, setNextCursor] = useState<string | null>(null);

    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const previousScrollHeightRef = useRef<number>(0);
    const isLoadingMoreRef = useRef<boolean>(false);

    // Check scroll position
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;

        // At bottom check
        const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
        setIsAtBottom(isBottom);

        // At top check - load more
        if (scrollTop === 0 && nextCursor && !isFetching) {
            fetchNextPage();
        }
    };

    // Auto-scroll to bottom function
    const scrollToBottom = (behavior: "auto" | "smooth" = "auto") => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior });
        }
    };

    // Mark notifications as read when entering chat
    useEffect(() => {
        if (paramValue) {
            notificationManager.markRelatedAsRead(paramValue);
        }
    }, [paramValue]);

    // Fetch next page (older messages)
    const fetchNextPage = async () => {
        if (!nextCursor || isFetching) return;

        // Capture specific scroll info before fetch starts isn't useful for layout adjustment,
        // we need it right before state update or use what we have.
        // But we DO need to know we are loading more.
        isLoadingMoreRef.current = true;
        setIsFetching(true);

        // Capture current scroll height to calculate diff later
        if (scrollContainerRef.current) {
            previousScrollHeightRef.current = scrollContainerRef.current.scrollHeight;
        }

        try {
            const res = await fetch(`${apiUrl}?${paramKey}=${paramValue}&cursor=${nextCursor}`);
            if (res.ok) {
                const data = await res.json();

                if (data.items) { // Handle paginated response
                    setMessages(prev => [...data.items.reverse(), ...prev]);
                    setNextCursor(data.nextCursor);
                } else if (Array.isArray(data)) { // Fallback for legacy array response (shouldn't happen with new API)
                    // If existing backend doesn't support cursor, we can't paginate well.
                    // Assuming new API structure.
                    setMessages(data.reverse());
                    setNextCursor(null);
                }
            }
        } catch (error) {
            console.error("Failed to fetch messages:", error);
            isLoadingMoreRef.current = false; // Reset on error
        } finally {
            setIsFetching(false);
        }
    };

    // Initial Fetch
    useEffect(() => {
        const fetchMessages = async () => {
            setIsFetching(true);
            try {
                const res = await fetch(`${apiUrl}?${paramKey}=${paramValue}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.items) {
                        setMessages(data.items.reverse());
                        setNextCursor(data.nextCursor);
                    } else if (Array.isArray(data)) {
                        setMessages(data.reverse());
                        setNextCursor(null);
                    }
                }
            } finally {
                setIsFetching(false);
            }
        };
        fetchMessages();

        // Poll every 2 seconds for NEW messages (optional, socket puts them in too)
        // Note: Polling might be redundant if sockets work well, but good fallback.
        // Ideally polling should only fetch *new* messages after the last one we have.
        // For simplicity, we'll rely on sockets for updates and only poll if we implement "since" logic.
        // Current implementation re-fetches everything which breaks pagination.
        // REMOVING polling to fix pagination stability and rely on Sockets.

        // const intervalId = setInterval(fetchMessages, 2000);
        // return () => clearInterval(intervalId);
    }, [apiUrl, paramKey, paramValue]);

    // Handle Scroll Position Maintenance after loading more
    useLayoutEffect(() => {
        if (isLoadingMoreRef.current && scrollContainerRef.current) {
            const newScrollHeight = scrollContainerRef.current.scrollHeight;
            const diff = newScrollHeight - previousScrollHeightRef.current;

            // Restore scroll position
            scrollContainerRef.current.scrollTop = diff;
            isLoadingMoreRef.current = false;
        }
    }, [messages]);

    // Auto-scroll logic for NEW messages
    useEffect(() => {
        // If we are not loading more history, and (at bottom or first load)
        if (!isLoadingMoreRef.current) {
            if (isAtBottom) {
                scrollToBottom("smooth");
            }

            // Also mark as read when new messages come in if we are looking at them
            if (isAtBottom && paramValue) {
                notificationManager.markRelatedAsRead(paramValue);
            }
        }
    }, [messages, isAtBottom, paramValue]);

    // Real-time listener
    useEffect(() => {
        if (!socket) return;

        const channelKey = paramKey === "channelId" ? "new-message" : "new-dm";

        const handleNewMessage = (message: any) => {
            setMessages((current) => {
                // Prevent duplicates
                if (current.some(m => m.id === message.id)) return current;
                return [...current, message];
            });
        };

        socket.on(channelKey, handleNewMessage);

        return () => {
            socket.off(channelKey, handleNewMessage);
        }
    }, [socket, paramKey]);

    const handleDownload = (e: React.MouseEvent, url: string, filename: string) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Media Viewer Overlay ... (No changes) */}
            {viewerMedia && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col animate-in fade-in duration-300">
                    <div className="flex items-center justify-between p-4 text-white">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-md">{viewerMedia.name}</span>
                            <span className="text-xs opacity-60 uppercase tracking-widest">{viewerMedia.type.split('/')[1]}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={(e) => handleDownload(e, viewerMedia.url, viewerMedia.name)}
                                className="p-2 hover:bg-white/10 rounded-full transition"
                                title="Download"
                            >
                                <Download className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => setViewerMedia(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition"
                                title="Close"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 flex items-center justify-center p-4">
                        {viewerMedia.type.startsWith('image/') ? (
                            <img
                                src={viewerMedia.url}
                                alt={viewerMedia.name}
                                className="max-w-full max-h-full object-contain shadow-2xl"
                            />
                        ) : (
                            <video
                                src={viewerMedia.url}
                                controls
                                autoPlay
                                className="max-w-full max-h-full shadow-2xl"
                            />
                        )}
                    </div>
                </div>
            )}

            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 flex flex-col scroll-smooth"
            >
                {/* Loader for Infinite Scroll */}
                {isFetching && nextCursor && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                <div className="flex-1" /> {/* Spacer to push messages down */}

                {messages.length === 0 && !isFetching ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
                        <div className="text-center space-y-2">
                            <p className="text-sm">No messages yet</p>
                            <p className="text-xs opacity-60">Say hello! 👋</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 sm:gap-4">
                        {messages.map((msg, i) => {
                            const isMe = member?.id === msg.senderId;
                            return (
                                <div key={msg.id || i} className={`flex gap-2 sm:gap-3 items-start group animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMe ? "flex-row-reverse" : ""}`}>
                                    <Link href={`/profile/${msg.sender?.id || msg.senderId}`} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-background shadow-sm hover:opacity-80 transition">
                                        <img
                                            src={msg.sender?.image || "/placeholder-user.jpg"}
                                            alt={msg.sender?.name || "User"}
                                            className="w-full h-full object-cover"
                                        />
                                    </Link>
                                    <div className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${isMe ? "items-end" : "items-start"}`}>
                                        <div className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                                            <Link href={`/profile/${msg.sender?.id || msg.senderId}`} className="font-medium text-xs sm:text-sm hover:underline hover:text-primary transition">
                                                {msg.sender?.name || "User"}
                                            </Link>
                                            <span className="text-xs text-muted-foreground">{format(new Date(msg.createdAt || Date.now()), "HH:mm")}</span>
                                        </div>
                                        <div className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl break-words shadow-sm ${isMe
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-muted rounded-tl-sm"
                                            }`}>
                                            {msg.fileUrl && (
                                                <div className="mb-2">
                                                    {msg.fileType?.startsWith('image/') ? (
                                                        <div
                                                            className="rounded-lg overflow-hidden border border-border/20 my-1 relative group/media cursor-pointer hover:opacity-95 transition"
                                                            onClick={() => setViewerMedia({ url: msg.fileUrl!, type: msg.fileType!, name: msg.fileName || 'image.jpg' })}
                                                        >
                                                            <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition flex items-center justify-center opacity-0 group-hover/media:opacity-100">
                                                                <Maximize2 className="text-white w-8 h-8 drop-shadow-lg" />
                                                            </div>
                                                            <img
                                                                src={msg.fileUrl}
                                                                alt={msg.fileName || "Image"}
                                                                className="max-w-full h-auto max-h-[300px] object-cover bg-background/10"
                                                                loading="lazy"
                                                            />
                                                            <button
                                                                onClick={(e) => handleDownload(e, msg.fileUrl!, msg.fileName || 'image.jpg')}
                                                                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover/media:opacity-100 transition shadow-sm"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : msg.fileType?.startsWith('video/') ? (
                                                        <div className="relative group/media my-1 max-w-[300px]">
                                                            <VideoPlayer
                                                                src={msg.fileUrl}
                                                                className="w-full h-auto rounded-lg shadow-sm bg-black/10 aspect-video"
                                                            />
                                                            <button
                                                                onClick={(e) => handleDownload(e, msg.fileUrl!, msg.fileName || 'video.mp4')}
                                                                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover/media:opacity-100 transition shadow-sm z-10"
                                                                title="Download"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 my-1">
                                                            <a
                                                                href={msg.fileUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`flex-1 flex items-center gap-3 p-3 rounded-lg border ${isMe ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20" : "bg-background/50 border-border/10 hover:bg-background/80"} transition`}
                                                            >
                                                                <div className={`p-2 rounded-md ${isMe ? "bg-primary-foreground/20" : "bg-background/50"}`}>
                                                                    {msg.fileType?.includes('pdf') ? (
                                                                        <FileText className="w-6 h-6" />
                                                                    ) : (
                                                                        <File className="w-6 h-6" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0 text-left">
                                                                    <p className="text-sm font-semibold truncate max-w-[150px] sm:max-w-[200px]">{msg.fileName || "File attachment"}</p>
                                                                    <p className="text-xs opacity-80 uppercase tracking-wider font-medium">{msg.fileType?.split('/')[1]?.toUpperCase() || 'FILE'}</p>
                                                                </div>
                                                            </a>
                                                            <button
                                                                onClick={(e) => handleDownload(e, msg.fileUrl!, msg.fileName || 'attachment')}
                                                                className={`p-2 rounded-lg border ${isMe ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20" : "bg-background/50 border-border/10 hover:bg-background/80"} transition shadow-sm`}
                                                                title="Download"
                                                            >
                                                                <Download className={`w-5 h-5 ${isMe ? "text-primary-foreground" : "text-foreground"}`} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div ref={bottomRef} className="h-1" />
            </div>
        </div>
    );
};
