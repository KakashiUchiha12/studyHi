import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Hash, ArrowLeft, Settings, LogOut } from "lucide-react";

export default async function CommunityLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: { id: string };
}) {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/api/auth/signin");
    }

    const community = await prisma.community.findUnique({
        where: { id: params.id },
        include: {
            channels: true,
            _count: {
                select: { members: true }
            }
        }
    });

    if (!community) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Community Header */}
            <header className="bg-white border-b border-border shadow-sm sticky top-0 z-10">
                <div className="container mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/community" className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                {community.name[0].toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-lg font-bold leading-tight">{community.name}</h1>
                                <div className="text-xs text-muted-foreground">{community._count.members} members</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                            <Settings className="w-5 h-5 text-muted-foreground" />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="flex-1 container mx-auto max-w-7xl p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Persistent Sidebar */}
                <aside className="hidden lg:block lg:col-span-3 space-y-6">
                    <Card className="h-fit">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                Channels
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 p-2">
                            <Link href={`/community/${community.id}`}>
                                <Button variant="ghost" className="w-full justify-start font-medium text-foreground">
                                    <Hash className="w-4 h-4 mr-2" />
                                    Home
                                </Button>
                            </Link>
                            {community.channels.map((channel: { id: string; name: string }) => (
                                <Link key={channel.id} href={`/community/${community.id}/channel/${channel.id}`}>
                                    <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50">
                                        <Hash className="w-4 h-4 mr-2 opacity-70" />
                                        {channel.name}
                                    </Button>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="text-xs text-muted-foreground text-center">
                        Community ID: {community.id.slice(0, 8)}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="lg:col-span-9 min-h-[500px]">
                    {children}
                </main>
            </div>
        </div>
    );
}
