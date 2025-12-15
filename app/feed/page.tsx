"use client";

import { FeedView } from "@/components/feed/feed-view";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { SocialSidebar } from "@/components/social/social-sidebar";

export default function GlobalFeedPage() {
    const { data: session } = useSession();

    return (
        <div className="container max-w-6xl py-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Left Sidebar - Navigation */}
                <aside className="w-full md:w-64 lg:w-72 shrink-0">
                    <SocialSidebar />
                </aside>

                {/* Main Content - Feed */}
                <main className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold mb-6">Your Feed</h1>
                    <FeedView currentUser={session?.user} />
                </main>

                {/* Right Sidebar - Trending/Interactive (Optional, could be hidden on smaller screens) */}
                <aside className="hidden lg:block w-80 shrink-0 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Trending</CardTitle>
                            <CardDescription>Popular in the community</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Trending posts coming soon...</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Suggested Communities</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Suggestions coming soon...</p>
                        </CardContent>
                    </Card>
                </aside>
            </div>
        </div>
    );
}
