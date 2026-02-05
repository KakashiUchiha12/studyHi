"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, Globe, Users, MessageSquare, User, LayoutDashboard } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";

export function MobileNavMenu() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const userId = (session?.user as any)?.id;

    // Fetch unread counts
    const { data: unread = { notifications: 0, messages: 0 } } = useQuery({
        queryKey: ['unread-counts', userId],
        queryFn: async () => {
            const res = await fetch("/api/notifications/unread-count");
            if (!res.ok) return { notifications: 0, messages: 0 };
            return res.json();
        },
        enabled: !!userId,
        refetchInterval: 60000,
        staleTime: 45000,
    });

    const navItems = [
        {
            title: "Global Feed",
            href: "/feed",
            icon: Globe,
        },
        {
            title: "Communities",
            href: "/community",
            icon: Users,
        },
        {
            title: "Messages",
            href: "/messages",
            icon: MessageSquare,
            count: unread.messages,
        },
        {
            title: "My Profile",
            href: userId ? `/profile/${userId}` : "/api/auth/signin",
            icon: User,
        },
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="w-5 h-5" />
                    <span className="sr-only">Navigation Menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                {navItems.map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                        <Link
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 cursor-pointer",
                                pathname === item.href && "bg-accent"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            <span>{item.title}</span>
                            {item.count && item.count > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                                    {item.count > 99 ? "99+" : item.count}
                                </span>
                            )}
                        </Link>
                    </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer text-muted-foreground">
                        <LayoutDashboard className="w-4 h-4" />
                        <span>Back to Dashboard</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
