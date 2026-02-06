"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, ShieldCheck } from "lucide-react";
import Link from 'next/link';

interface Member {
    id: string;
    role: string;
    joinedAt: string;
    user: {
        id: string;
        name: string;
        image: string | null;
    };
}

interface MembersListProps {
    communityId: string;
}

export function MembersList({ communityId }: MembersListProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const res = await fetch(`/api/communities/${communityId}/members`);
                if (res.ok) {
                    const data = await res.json();
                    setMembers(data);
                }
            } catch (error) {
                console.error("Failed to fetch members", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMembers();
    }, [communityId]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-muted-foreground w-8 h-8" />
            </div>
        );
    }

    const admins = members.filter(m => m.role === 'admin' || m.role === 'owner');
    const regularMembers = members.filter(m => m.role !== 'admin' && m.role !== 'owner');

    return (
        <div className="space-y-8">
            {admins.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        Admins & Moderators
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {admins.map(member => (
                            <MemberCard key={member.id} member={member} />
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Members ({regularMembers.length})</h3>
                {regularMembers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {regularMembers.map(member => (
                            <MemberCard key={member.id} member={member} />
                        ))}
                    </div>
                ) : (
                    <div className="text-muted-foreground italic">No other members yet.</div>
                )}
            </div>
        </div>
    );
}

function MemberCard({ member }: { member: Member }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-white shadow-sm">
            <Avatar>
                <AvatarImage src={member.user.image || ""} />
                <AvatarFallback>{member.user.name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <Link href={`/profile/${member.user.id}`} className="font-medium hover:underline truncate block">
                    {member.user.name}
                </Link>
                <div className="text-xs text-muted-foreground flex justify-between">
                    <span className="capitalize">{member.role}</span>
                    <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
}
