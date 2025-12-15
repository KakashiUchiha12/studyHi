"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MessageSquare, Users, Globe, User, LayoutDashboard, Settings } from "lucide-react";
import { useSession } from "next-auth/react";

export function SocialSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const userId = (session?.user as any)?.id;

    const navItems = [
        {
            title: "Global Feed",
            href: "/feed",
            icon: Globe
        },
        {
            title: "Communities",
            href: "/community",
            icon: Users
        },
        {
            title: "Messages",
            href: "/messages",
            icon: MessageSquare
        },
        {
            title: "My Profile",
            href: userId ? `/profile/${userId}` : "/api/auth/signin",
            icon: User
        }
    ];

    return (
        <Card className="h-fit sticky top-4 w-full md:w-64 lg:w-72 hidden md:block border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0">
                <CardTitle className="text-lg font-bold px-4 mb-2">Social</CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-2">
                {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                        <Button
                            variant={pathname === item.href ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start gap-3",
                                pathname === item.href ? "bg-accent" : ""
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            {item.title}
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
