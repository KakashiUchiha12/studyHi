"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Shield, User as UserIcon, Search, MoreVertical, Trash2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface Member {
    id: string; // The Member ID
    role: string;
    joinedAt: string;
    user: {
        id: string; // The User ID
        name: string;
        image: string | null;
    };
    userId: string;
}

export default function CommunityMembersPage() {
    const params = useParams();
    const { data: session } = useSession();
    const { toast } = useToast();
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const fetchMembers = async () => {
            if (!params?.id) return;
            try {
                const res = await fetch(`/api/communities/${params.id}/members`);
                if (res.ok) {
                    const data = await res.json();
                    setMembers(data);

                    // Check if current user is admin
                    const currentUser = (session?.user as any)?.id;
                    const me = data.find((m: Member) => m.userId === currentUser);
                    if (me && me.role === 'admin') {
                        setIsAdmin(true);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        if (session) fetchMembers();
    }, [params?.id, session]);

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const res = await fetch(`/api/communities/${params.id}/members/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });

            if (res.ok) {
                setMembers(members.map(m => m.user.id === userId ? { ...m, role: newRole } : m));
                toast({ title: "Role updated" });
            } else {
                throw new Error("Failed");
            }
        } catch (e) {
            toast({ title: "Error", description: "Could not update role", variant: "destructive" });
        }
    };

    const handleKick = async (userId: string) => {
        if (!confirm("Are you sure you want to kick this member?")) return;
        try {
            const res = await fetch(`/api/communities/${params.id}/members/${userId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setMembers(members.filter(m => m.user.id !== userId));
                toast({ title: "Member kicked" });
            } else {
                throw new Error("Failed");
            }
        } catch (e) {
            toast({ title: "Error", description: "Could not kick member", variant: "destructive" });
        }
    };

    const filteredMembers = members.filter(member =>
        member.user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-muted-foreground" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Community Members</h1>
                    <p className="text-muted-foreground">Meet the people in this community.</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        placeholder="Search members..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map((member) => (
                    <Card key={member.id} className="overflow-hidden">
                        <CardContent className="p-6 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                                <Link href={`/profile/${member.user.id}`}>
                                    <Avatar className="w-12 h-12 border-2 border-white shadow-sm cursor-pointer hover:opacity-80 transition-opacity">
                                        <AvatarImage src={member.user.image || ""} />
                                        <AvatarFallback className="text-lg bg-primary/10 text-primary">
                                            {member.user.name[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Link>

                                <div className="min-w-0">
                                    <Link href={`/profile/${member.user.id}`} className="hover:underline">
                                        <h3 className="font-semibold text-base truncate">{member.user.name}</h3>
                                    </Link>
                                    <div className="flex items-center gap-2 mt-1">
                                        {member.role === 'admin' ? (
                                            <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-0 h-5 text-[10px] px-2">
                                                <Shield className="w-3 h-3 mr-1 fill-current" /> Admin
                                            </Badge>
                                        ) : member.role === 'moderator' ? (
                                            <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-0 h-5 text-[10px] px-2">
                                                <Shield className="w-3 h-3 mr-1" /> Mod
                                            </Badge>
                                        ) : (
                                            <span className="text-xs text-muted-foreground flex items-center">
                                                Member
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {isAdmin && (session?.user as any)?.id !== member.user.id && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {member.role !== 'admin' && (
                                            <DropdownMenuItem onClick={() => handleRoleChange(member.user.id, 'admin')}>
                                                <ArrowUpCircle className="w-4 h-4 mr-2" /> Promote to Admin
                                            </DropdownMenuItem>
                                        )}
                                        {member.role === 'admin' && (
                                            <DropdownMenuItem onClick={() => handleRoleChange(member.user.id, 'member')}>
                                                <ArrowDownCircle className="w-4 h-4 mr-2" /> Demote to Member
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleKick(member.user.id)}>
                                            <Trash2 className="w-4 h-4 mr-2" /> Kick Member
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {members.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No members found.
                </div>
            )}
        </div>
    );
}
