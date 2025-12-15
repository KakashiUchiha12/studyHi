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

    // Initial Fetch
    useEffect(() => {
        const fetchMessages = async () => {
            const res = await fetch(`${apiUrl}?${paramKey}=${paramValue}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        };
        fetchMessages();
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
        <div className="flex-1 flex flex-col py-4 overflow-y-auto">
            <div className="flex-1" />
            <div className="flex flex-col-reverse mt-auto">
                {/* Messages are displayed here. Flex-col-reverse means validation needed or I map normally */}
                {/* Let's render normally for now */}
                <div className="flex flex-col gap-4 px-4">
                    {messages.map((msg, i) => (
                        <div key={msg.id || i} className="flex gap-2 items-start group">
                            <div className="w-8 h-8 rounded-full bg-slate-300 flex-shrink-0" />
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">{msg.sender?.name || "User"}</span>
                                    <span className="text-xs text-muted-foreground">{format(new Date(msg.createdAt || Date.now()), "HH:mm")}</span>
                                </div>
                                <p className="text-sm text-foreground">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
            </div>
        </div>
    );
}
