"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Bell, MessageSquare, Users, UserCircle, Globe, Settings2, Home, User, LayoutDashboard } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

export function SocialSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const userId = (session?.user as any)?.id;

    // Fetch unread counts with React Query - automatic polling
    const { data: unread = { notifications: 0, messages: 0 } } = useQuery({
        queryKey: ['unread-counts', userId],
        queryFn: async () => {
            const res = await fetch("/api/notifications/unread-count");
            if (!res.ok) return { notifications: 0, messages: 0 };
            return res.json();
        },
        enabled: !!userId, // Only run if user is logged in
        refetchInterval: 60000, // Poll every 60s
        staleTime: 45000, // Consider fresh for 45s
    });

    const navItems = [
        {
            title: "Global Feed",
            href: "/feed",
            icon: Globe,
            count: 0
        },
        {
            title: "Communities",
            href: "/community",
            icon: Users,
            count: 0
        },
        {
            title: "Messages",
            href: "/messages",
            icon: MessageSquare,
            count: unread.messages
        },
        {
            title: "My Profile",
            href: userId ? `/profile/${userId}` : "/api/auth/signin",
            icon: User,
            count: 0
        }
    ];

    return (
        <Card className="h-fit sticky top-24 w-full md:w-56 lg:w-64 hidden md:block border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-bold px-4 mb-2">Social</CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-2">
                {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Button
                            variant={pathname === item.href ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start gap-3 relative",
                                pathname === item.href ? "bg-accent" : ""
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.title}
                            {item.count > 0 && (
                                <span className="absolute right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                                    {item.count > 99 ? "99+" : item.count}
                                </span>
                            )}
                        </Button>
                    </Link>
                ))}

                <div className="my-4 border-t opacity-50" />

                <Link href="/dashboard">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
                        <LayoutDashboard className="w-4 h-4" />
                        Back to Dashboard
                    </Button>
                </Link>
            </CardContent>
        </Card>
    );
}
