"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FeedView } from "@/components/feed/feed-view";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";

export default function CommunityHome() {
    const params = useParams();
    const { data: session } = useSession();
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Community Feed</h2>
            </div>

            <Tabs defaultValue="posts">
                <TabsList className="w-full sm:w-auto">
                    <TabsTrigger value="posts">Posts</TabsTrigger>
                    <TabsTrigger value="announcements">Announcements</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="space-y-4 mt-6">
                    <FeedView communityId={params.id as string} currentUser={session?.user} />
                </TabsContent>

                <TabsContent value="announcements">
                    <div className="text-center py-20 text-muted-foreground bg-white rounded-xl border border-dashed">
                        <p>No announcements.</p>
                    </div>
                </TabsContent>

                <TabsContent value="members">
                    <div className="text-center py-20 text-muted-foreground bg-white rounded-xl border border-dashed">
                        <p>Member list coming soon.</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
