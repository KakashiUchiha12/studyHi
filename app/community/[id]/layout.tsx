import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Hash, ArrowLeft, Settings, LogOut, Info, BookOpen, Users } from "lucide-react";
import { JoinButton } from "@/components/community/join-button";
import { ChannelList } from "@/components/community/channel-list";


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

    const membership = await prisma.communityMember.findUnique({
        where: {
            communityId_userId: {
                communityId: params.id,
                userId: (session.user as { id: string }).id
            }
        }
    });

    const isAdmin = membership?.role === "admin";

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Community Header */}
            {community.coverImage && (
                <div className="w-full aspect-[3/1] md:aspect-[4/1] lg:aspect-[5/1] xl:aspect-[6/1] relative bg-slate-200 overflow-hidden">
                    <img
                        src={community.coverImage}
                        alt="Cover"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
            )}

            <header className="bg-white border-b border-border shadow-sm sticky top-0 z-10">
                <div className="container mx-auto max-w-7xl px-4 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/community" className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl overflow-hidden relative shadow-sm">
                                {community.icon ? (
                                    <img src={community.icon} alt="Icon" className="w-full h-full object-cover" />
                                ) : (
                                    community.name[0].toUpperCase()
                                )}
                            </div>
                            <div>
                                <Link href={`/community/${community.id}`} className="hover:underline">
                                    <h1 className="text-2xl font-bold leading-tight">{community.name}</h1>
                                </Link>
                                <div className="text-sm text-muted-foreground mt-1">{community._count.members} members</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <JoinButton
                            communityId={community.id}
                            isMember={!!membership}
                            description=""
                        />
                        {isAdmin && (
                            <Link href={`/community/${community.id}/settings`}>
                                <Button variant="ghost" size="icon">
                                    <Settings className="w-5 h-5 text-muted-foreground" />
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-1 container mx-auto max-w-7xl p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Persistent Sidebar */}
                <aside className="hidden lg:block lg:col-span-3 space-y-6">
                    <ChannelList
                        communityId={community.id}
                        initialChannels={community.channels}
                        isAdmin={isAdmin}
                    />

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                                <Users className="w-4 h-4" /> Directory
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1 p-2">
                            <Link href={`/community/${community.id}/members`}>
                                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                                    <Users className="w-4 h-4 mr-2" />
                                    Members
                                    <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">
                                        {community._count.members}
                                    </span>
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                                <Info className="w-4 h-4" /> About
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm prose prose-sm max-w-none dark:prose-invert">
                            {community.description ? (
                                <div dangerouslySetInnerHTML={{ __html: community.description }} />
                            ) : (
                                <span className="text-muted-foreground italic">No description.</span>
                            )}
                        </CardContent>
                    </Card>

                    {community.rules && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                                    <BookOpen className="w-4 h-4" /> Rules
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm prose prose-sm max-w-none dark:prose-invert">
                                <div dangerouslySetInnerHTML={{ __html: community.rules }} />
                            </CardContent>
                        </Card>
                    )}

                    <div className="text-xs text-muted-foreground text-center">
                        Community ID: {community.id.slice(0, 8)}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="lg:col-span-9 min-h-[500px]">
                    {children}
                </main>
            </div>
        </div >
    );
}
