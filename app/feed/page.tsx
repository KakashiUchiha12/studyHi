"use client";

import { FeedView } from "@/components/feed/feed-view";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SocialSidebar } from "@/components/social/social-sidebar";
import { MobileNavMenu } from "@/components/mobile-nav-menu";
import { StudyHiLogo } from "@/components/ui/studyhi-logo";
import Link from "next/link";

export default function GlobalFeedPage() {
    const { data: session } = useSession();

    return (
        <>
            {/* Mobile Header */}
            <header className="md:hidden border-b border-border bg-white px-4 py-3 sticky top-0 z-10">
                <div className="flex items-center justify-between">
                    <Link href="/dashboard">
                        <StudyHiLogo size="sm" />
                    </Link>
                    <MobileNavMenu />
                </div>
            </header>

            <div className="container max-w-[1600px] py-6 px-4 md:px-6">
                <div className="flex flex-col md:flex-row gap-4 lg:gap-6 justify-center">
                    {/* Left Sidebar - Navigation */}
                    <aside className="hidden md:block w-56 lg:w-64 shrink-0 top-20 h-fit sticky">
                        <SocialSidebar />
                    </aside>

                    {/* Main Content - Feed */}
                    <main className="flex-1 max-w-2xl lg:max-w-3xl min-w-0 w-full">
                        <h1 className="text-2xl font-bold mb-4 px-2">Your Feed</h1>
                        <FeedView currentUser={session?.user} />
                    </main>

                    {/* Right Sidebar - Trending/Interactive */}
                    <aside className="hidden xl:block w-72 shrink-0 space-y-6 top-20 h-fit sticky">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Trending</CardTitle>
                                <CardDescription>Popular in the community</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Trending posts coming soon...</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Suggested Communities</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">Suggestions coming soon...</p>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </>
    );
}
