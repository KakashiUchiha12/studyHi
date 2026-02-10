import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { Download, X, Maximize2, FileText, File } from "lucide-react";

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
    const bottomRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom function
    const scrollToBottom = () => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    };

    // Initial Fetch & Polling
    useEffect(() => {
        const fetchMessages = async () => {
            const res = await fetch(`${apiUrl}?${paramKey}=${paramValue}`);
            if (res.ok) {
                const data = await res.json();
                if (data.items) {
                    setMessages(data.items.reverse());
                } else if (Array.isArray(data)) {
                    setMessages(data.reverse());
                }
            }
        };
        fetchMessages();

        // Poll every 2 seconds
        const intervalId = setInterval(fetchMessages, 2000);

        return () => clearInterval(intervalId);
    }, [apiUrl, paramKey, paramValue]);

    // Auto-scroll when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Real-time listener
    useEffect(() => {
        if (!socket) return;

        const channelKey = paramKey === "channelId" ? "new-message" : "new-dm";

        socket.on(channelKey, (message: any) => {
            // Append message
            setMessages((current) => [...current, message]);
        });

        return () => {
            socket.off(channelKey);
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
            {/* Media Viewer Overlay */}
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
                className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 flex flex-col scroll-smooth"
            >
                <div className="flex-1" /> {/* Spacer to push messages down */}
                {messages.length === 0 ? (
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
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-background shadow-sm">
                                        <img
                                            src={msg.sender?.image || "/placeholder-user.jpg"}
                                            alt={msg.sender?.name || "User"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${isMe ? "items-end" : "items-start"}`}>
                                        <div className={`flex items-center gap-2 mb-1 ${isMe ? "flex-row-reverse" : ""}`}>
                                            <span className="font-medium text-xs sm:text-sm">{msg.sender?.name || "User"}</span>
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
                                                        <div
                                                            className="rounded-lg overflow-hidden border border-border/20 my-1 relative group/media cursor-pointer hover:opacity-95 transition"
                                                            onClick={() => setViewerMedia({ url: msg.fileUrl!, type: msg.fileType!, name: msg.fileName || 'video.mp4' })}
                                                        >
                                                            <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/20 transition flex items-center justify-center opacity-0 group-hover/media:opacity-100 pointer-events-none">
                                                                <Maximize2 className="text-white w-8 h-8 drop-shadow-lg" />
                                                            </div>
                                                            <video
                                                                src={msg.fileUrl}
                                                                className="max-w-full max-h-[300px]"
                                                            />
                                                            <button
                                                                onClick={(e) => handleDownload(e, msg.fileUrl!, msg.fileName || 'video.mp4')}
                                                                className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full opacity-0 group-hover/media:opacity-100 transition shadow-sm z-10"
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
}
