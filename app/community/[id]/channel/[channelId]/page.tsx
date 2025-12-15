"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSocket } from "@/components/providers/socket-provider";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-messages";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function ChannelPage() {
    const params = useParams();
    const { socket, isConnected } = useSocket();
    const { data: session } = useSession();
    const [channelName, setChannelName] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch channel details to get name
        // Or get it from layout/cache if possible, but simplest is fetch community again or specific channel endpoint
        // I'll just use "Channel" placeholder or fetch basics
        const fetchChannel = async () => {
            // Ideally we have an endpoint for channel details or get it from community
            // /api/communities/[id] returns channels. 
            // I'll fetch community to find channel name
            try {
                const res = await fetch(`/api/communities/${params.id}`);
                if (res.ok) {
                    const data = await res.json();
                    const channel = data.channels.find((c: any) => c.id === params.channelId);
                    if (channel) setChannelName(channel.name);
                }
            } catch (e) { } finally {
                setLoading(false);
            }
        };
        fetchChannel();
    }, [params.id, params.channelId]);

    useEffect(() => {
        if (socket && isConnected && params.channelId) {
            socket.emit("join-channel", params.channelId);
            return () => {
                socket.emit("leave-channel", params.channelId);
            }
        }
    }, [socket, isConnected, params.channelId]);


    if (loading || !session) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin w-8 h-8 text-muted-foreground" /></div>;

    return (
        <div className="bg-white flex flex-col h-[calc(100vh-180px)] lg:h-[700px] border rounded-xl overflow-hidden shadow-sm">
            <div className="h-12 border-b px-4 flex items-center shadow-sm bg-slate-50">
                <p className="font-semibold text-md flex items-center">
                    <span className="text-muted-foreground mr-1">#</span>
                    {channelName || "channel"}
                </p>
                {!isConnected && (
                    <span className="ml-auto text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                        Connecting...
                    </span>
                )}
                {isConnected && (
                    <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full animate-pulse">
                        Live
                    </span>
                )}
            </div>

            <ChatMessages
                name={channelName}
                member={session.user}
                chatId={params.channelId as string}
                apiUrl="/api/messages"
                socketUrl="/api/socket/messages"
                socket={socket}
                paramKey="channelId"
                paramValue={params.channelId as string}
            />

            <ChatInput
                name={channelName}
                socket={socket}
                channelId={params.channelId as string}
                senderId={(session.user as any).id || ""} // Session user ID needs to be exposed in session callback
            />
        </div>
    );
}
