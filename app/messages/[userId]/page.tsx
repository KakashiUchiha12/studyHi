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
        <div className="container max-w-4xl py-6 h-[calc(100vh-4rem)]">
            <Card className="h-full flex flex-col">
                <CardHeader className="border-b py-3">
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-full transition">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <CardTitle className="text-lg flex items-center gap-2">
                            Chat
                        </CardTitle>
                    </div>
                </CardHeader>
                <div className="flex-1 overflow-hidden flex flex-col relative">
                    <ChatMessages
                        chatId={otherUserId} // Using otherUserID as ID for query key
                        type="conversation"
                        apiUrl={`/api/messages/${otherUserId}`}
                        socketUrl="/api/socket/direct-messages"
                        socket={socket}
                        paramKey="conversationId"
                        paramValue={otherUserId}
                        name="Chat"
                        member={session?.user as any} // Pass current user
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
            </Card>
        </div>
    );
}
