"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar, MapPin, Users, Check, HelpCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface EventCardProps {
    event: any;
    communityId: string;
    onRsvpChange?: () => void;
}

export function EventCard({ event, communityId, onRsvpChange }: EventCardProps) {
    const [loading, setLoading] = useState(false);
    const [myStatus, setMyStatus] = useState<string | null>(null); // Ideally passed from parent

    const handleRsvp = async (status: "going" | "maybe" | "not_going") => {
        setLoading(true);
        try {
            const res = await fetch(`/api/communities/${communityId}/events/${event.id}/rsvp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                toast.success("RSVP updated");
                setMyStatus(status);
                if (onRsvpChange) onRsvpChange();
            } else {
                toast.error("Failed to update RSVP");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="overflow-hidden">
            {event.coverImage && (
                <div className="h-32 w-full relative">
                    <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" />
                </div>
            )}
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <Badge variant="secondary" className="mb-2">
                            {format(new Date(event.startDate), "MMM d, h:mm a")}
                        </Badge>
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {event.description}
                </p>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    {event.location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{event._count?.attendees || 0} attending</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs text-muted-foreground">Hosted by</span>
                    <div className="flex items-center gap-1">
                        <Avatar className="w-5 h-5">
                            <AvatarImage src={event.creator.image} />
                            <AvatarFallback>{event.creator.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{event.creator.name}</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="border-t bg-slate-50 p-2 flex justify-between gap-2">
                <Button
                    variant={myStatus === 'going' ? "default" : "ghost"}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleRsvp('going')}
                    disabled={loading}
                >
                    <Check className="w-4 h-4 mr-1" /> Going
                </Button>
                <Button
                    variant={myStatus === 'maybe' ? "secondary" : "ghost"}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleRsvp('maybe')}
                    disabled={loading}
                >
                    <HelpCircle className="w-4 h-4 mr-1" /> Maybe
                </Button>
                <Button
                    variant={myStatus === 'not_going' ? "destructive" : "ghost"}
                    size="sm"
                    onClick={() => handleRsvp('not_going')}
                    disabled={loading}
                >
                    <XCircle className="w-4 h-4" />
                </Button>
            </CardFooter>
        </Card>
    );
}
