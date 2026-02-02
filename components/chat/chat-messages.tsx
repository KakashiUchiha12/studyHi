"use client";

import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";

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
    const bottomRef = useRef<HTMLDivElement>(null);

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

    // Real-time listener
    useEffect(() => {
        if (!socket) return;

        const channelKey = paramKey === "channelId" ? "new-message" : "new-dm";

        socket.on(channelKey, (message: any) => {
            // Append message
            setMessages((current) => [...current, message]);
            // Scroll to bottom
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });

        return () => {
            socket.off(channelKey);
        }
    }, [socket, paramKey]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col" ref={bottomRef}>
                <div className="flex-1" /> {/* Spacer to push messages down */}
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground opacity-50">
                        <p>No messages yet</p>
                        <p className="text-xs">Say hello!</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {messages.map((msg, i) => {
                            const isMe = member?.id === msg.senderId;
                            return (
                                <div key={msg.id || i} className={`flex gap-2 items-start group ${isMe ? "flex-row-reverse" : ""}`}>
                                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border">
                                        <img
                                            src={msg.sender?.image || "/placeholder-user.jpg"}
                                            alt={msg.sender?.name || "User"}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">{msg.sender?.name || "User"}</span>
                                            <span className="text-xs text-muted-foreground">{format(new Date(msg.createdAt || Date.now()), "HH:mm")}</span>
                                        </div>
                                        <div className={`px-3 py-2 rounded-lg max-w-xs break-words ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div id="scroll-anchor" className="h-4" />
            </div>
        </div>
    );
}
