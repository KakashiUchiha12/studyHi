"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface JoinButtonProps {
    communityId: string;
    description: string;
    isMember: boolean;
    className?: string; // Additional classes
}

export function JoinButton({ communityId, isMember, className }: JoinButtonProps) {
    const [loading, setLoading] = useState(false);
    const [joined, setJoined] = useState(isMember);
    const router = useRouter();

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent link click if inside a card
        e.stopPropagation();

        if (loading) return;
        setLoading(true);

        try {
            if (joined) {
                // Leave
                if (!confirm("Are you sure you want to leave this community?")) {
                    setLoading(false);
                    return;
                }
                const res = await fetch(`/api/communities/${communityId}/join`, { method: "DELETE" });
                if (res.ok) {
                    setJoined(false);
                    router.refresh();
                } else {
                    const msg = await res.text();
                    alert(msg);
                }
            } else {
                // Join
                const res = await fetch(`/api/communities/${communityId}/join`, { method: "POST" });
                if (res.ok) {
                    setJoined(true);
                    router.refresh();
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant={joined ? "outline" : "default"}
            size="sm"
            className={cn("min-w-[80px]", className)}
            onClick={handleToggle}
            disabled={loading}
        >
            {loading && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
            {joined ? "Joined" : "Join"}
        </Button>
    );
}
