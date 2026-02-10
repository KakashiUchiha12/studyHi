"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSocket } from "@/components/providers/socket-provider";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function DirectMessagePage() {
    const { data: session } = useSession();
    const params = useParams();
    const otherUserId = params.userId as string;
    const { socket } = useSocket();

    useEffect(() => {
        if (socket && session?.user && (session.user as any).id) {
            socket.emit("join-user-room", (session.user as any).id);
        }
    }, [socket, session]);

    return (
        <div className="h-screen md:h-[calc(100vh-4rem)] w-full md:container md:max-w-4xl md:py-6">
            <div className="h-full w-full md:rounded-lg md:border md:shadow-lg bg-background flex flex-col">
                <div className="border-b py-3 px-4 bg-card sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <Link href="/messages" className="p-2 hover:bg-muted rounded-lg transition">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-lg font-semibold">Chat</h1>
                    </div>
                </div>
                <div className="flex-1 overflow-hidden flex flex-col relative bg-background">
                    <ChatMessages
                        chatId={otherUserId}
                        type="conversation"
                        apiUrl={`/api/messages/${otherUserId}`}
                        socketUrl="/api/socket/direct-messages"
                        socket={socket}
                        paramKey="conversationId"
                        paramValue={otherUserId}
                        name="Chat"
                        member={session?.user as any}
                    />
                    <ChatInput
                        socket={socket}
                        apiUrl="/api/socket/direct-messages"
                        query={{
                            receiverId: otherUserId
                        }}
                        name="Direct Message"
                        type="conversation"
                        member={session?.user}
                    />
                </div>
            </div>
        </div>
    );
}
