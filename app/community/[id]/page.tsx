"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { FeedView } from "@/components/feed/feed-view";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import { EventCard } from "@/components/community/event-card";
import { CreateEventDialog } from "@/components/community/create-event-dialog";
import { Loader2 } from "lucide-react";

import { MembersList } from "@/components/community/members-list";
import { HelpTooltip } from "@/components/classes/help-tooltip";

export default function CommunityHome() {
    const params = useParams();
    const { data: session } = useSession();
    const communityId = params.id as string;

    // Events State
    const [events, setEvents] = useState<any[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);

    const fetchEvents = async () => {
        setLoadingEvents(true);
        try {
            const res = await fetch(`/api/communities/${communityId}/events`);
            if (res.ok) setEvents(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingEvents(false);
        }
    };

    useEffect(() => {
        fetchEvents();
    }, [communityId]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">Community Hub</h2>
                <HelpTooltip content="📢 Announcements: Official updates from Admins/Moderators. 💬 Posts: General discussions open to all members." />
            </div>

            <Tabs defaultValue="posts">
                <TabsList className="w-full sm:w-auto grid grid-cols-4 sm:flex">
                    <TabsTrigger value="posts">Posts</TabsTrigger>
                    <TabsTrigger value="announcements">Announcements</TabsTrigger>
                    <TabsTrigger value="events">Events</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                </TabsList>

                <TabsContent value="posts" className="space-y-4 mt-6">
                    <FeedView communityId={communityId} currentUser={session?.user} />
                </TabsContent>

                <TabsContent value="announcements" className="mt-6">
                    <div className="mb-4 text-sm text-muted-foreground">
                        Official updates from community admins.
                    </div>
                    <FeedView
                        communityId={communityId}
                        currentUser={session?.user}
                        isAnnouncement={true}
                    />
                </TabsContent>

                <TabsContent value="events" className="mt-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">Upcoming Events</h3>
                            <HelpTooltip content="📅 Events: Scheduled activities for the community. You can see details like time and location, and RSVP to let others know if you're attending." />
                        </div>
                        <CreateEventDialog
                            communityId={communityId}
                            onEventCreated={fetchEvents}
                        />
                    </div>

                    {loadingEvents ? (
                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border border-dashed">
                            No upcoming events.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {events.map(event => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    communityId={communityId}
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="members" className="mt-6">
                    <MembersList communityId={communityId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
