"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { ChatMessages } from "@/components/chat/chat-messages";
import { ChatInput } from "@/components/chat/chat-input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSocket } from "@/components/providers/socket-provider";

export default function DirectMessagePage() {
    const { data: session } = useSession();
    const params = useParams();
    const otherUserId = params.userId as string;
    const { socket } = useSocket();

    // We don't have the other user's name immediately available here unless we fetch it.
    // ChatMessages might fetch it or valid messages will show it.
    // Ideally we should fetch the user profile here for the header.
    // For now, I'll pass a generic type or fetch it.

    return (
        <div className="container max-w-4xl py-6 h-[calc(100vh-4rem)]">
            <Card className="h-full flex flex-col">
                <CardHeader className="border-b py-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        Chat
                        {/* We could fetch user name here */}
                    </CardTitle>
                </CardHeader>
                <div className="flex-1 overflow-hidden flex flex-col relative">
                    <ChatMessages
                        chatId={otherUserId} // Using otherUserID as ID for query key
                        type="conversation"
                        apiUrl={`/api/messages/${otherUserId}`}
                        socketUrl="/api/socket/direct-messages" // Not used directly by current implementation but kept for consistency if needed
                        socketQuery={{}}
                        paramKey="conversationId"
                        paramValue={otherUserId}
                        member={session?.user as any} // Pass current user
                    // We need to modify ChatMessages to support "conversation" type or "channel" type
                    // Check ChatMessages implementation below
                    />
                    <ChatInput
                        apiUrl="/api/socket/direct-messages" // We'll bypass this and use socket directly in component or standard API?
                        // Actually, my server.ts listens to "send-message".
                        // ChatInput usually posts to an API which then emits socket event (pattern in some tutorials).
                        // BUT my current ChatInput implementation emits socket event directly? No, let's check.
                        // Wait, I need to check ChatInput implementation.
                        query={{
                            receiverId: otherUserId
                        }}
                        name="Direct Message"
                        type="conversation"
                    />
                </div>
            </Card>
        </div>
    );
}
