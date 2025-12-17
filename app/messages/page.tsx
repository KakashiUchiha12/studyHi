"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface Conversation {
    user: {
        id: string;
        name: string;
        image: string | null;
    };
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
}

import { SocialSidebar } from "@/components/social/social-sidebar";
import { MobileNavMenu } from "@/components/mobile-nav-menu";
import { StudyHiLogo } from "@/components/ui/studyhi-logo";

export default function MessagesPage() {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const res = await fetch("/api/messages/conversations");
                if (res.ok) {
                    const data = await res.json();
                    setConversations(data);
                }
            } catch (error) {
                console.error("Failed to fetch conversations", error);
            } finally {
                setLoading(false);
            }
        };

        fetchConversations();
    }, []);

    const content = loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    ) : (
        <div className="grid gap-4">
            {conversations.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                        No messages yet. Visit a profile to start a conversation!
                    </CardContent>
                </Card>
            ) : (
                conversations.map((conv) => (
                    <Link href={`/messages/${conv.user.id}`} key={conv.user.id}>
                        <Card className="hover:bg-accent/50 transition-colors">
                            <CardContent className="p-4 flex items-center gap-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={conv.user.image || ""} />
                                    <AvatarFallback>{conv.user.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-semibold truncate">{conv.user.name}</h3>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-muted-foreground truncate pr-4">
                                            {conv.lastMessage}
                                        </p>
                                        {conv.unreadCount > 0 && (
                                            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                                                {conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))
            )}
        </div>
    );

    return (
        <>
            {/* Mobile Header */}
            <header className="md:hidden border-b border-border bg-white px-4 py-3 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <Link href="/dashboard">
                        <StudyHiLogo size="sm" />
                    </Link>
                    {/* Mobile nav menu */}
                    <MobileNavMenu />
                </div>
            </header>

            <div className="container max-w-6xl py-8">
                <div className="flex flex-col md:flex-row gap-8">
                    <aside className="w-full md:w-64 lg:w-72 shrink-0">
                        <SocialSidebar />
                    </aside>
                    <main className="flex-1 min-w-0">
                        <h1 className="text-3xl font-bold mb-6">Messages</h1>
                        {content}
                    </main>
                </div>
            </div>
        </>
    );
}
