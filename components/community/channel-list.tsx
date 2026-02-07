"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { Hash, Plus, MoreVertical, Pencil, Trash2, Loader2, LayoutDashboard } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { notificationManager } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Channel {
    id: string;
    name: string;
    type: string;
}

interface ChannelListProps {
    communityId: string;
    initialChannels: Channel[];
    isAdmin: boolean;
}

export function ChannelList({ communityId, initialChannels, isAdmin }: ChannelListProps) {
    const [channels, setChannels] = useState<Channel[]>(initialChannels);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
    const [channelName, setChannelName] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();
    const { data: session } = useSession();
    const userId = (session?.user as any)?.id;

    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const unsubscribe = notificationManager.subscribe(setNotifications, userId);
        return unsubscribe;
    }, [userId]);

    const handleCreate = async () => {
        if (!channelName.trim()) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/communities/${communityId}/channels`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: channelName.trim() }),
            });

            if (!res.ok) throw new Error("Failed to create channel");

            const newChannel = await res.json();
            setChannels([...channels, newChannel]);
            setChannelName("");
            setIsCreateOpen(false);
            toast({ title: "Channel created" });
            router.refresh();
        } catch (error) {
            toast({ title: "Error", description: "Could not create channel", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!selectedChannel || !channelName.trim()) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/channels/${selectedChannel.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: channelName.trim() }),
            });

            if (!res.ok) throw new Error("Failed to update channel");

            const updated = await res.json();
            setChannels(channels.map(c => c.id === updated.id ? updated : c));
            setIsEditOpen(false);
            setChannelName("");
            setSelectedChannel(null);
            toast({ title: "Channel updated" });
            router.refresh();
        } catch (error) {
            toast({ title: "Error", description: "Could not update channel", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedChannel) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/channels/${selectedChannel.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete channel");

            setChannels(channels.filter(c => c.id !== selectedChannel.id));
            setIsDeleteOpen(false);
            setSelectedChannel(null);
            toast({ title: "Channel deleted" });

            // Redirect if we were on the deleted channel
            if (pathname.includes(selectedChannel.id)) {
                router.push(`/community/${communityId}`);
            }
            router.refresh();
        } catch (error) {
            toast({ title: "Error", description: "Could not delete channel", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const openEdit = (channel: Channel, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedChannel(channel);
        setChannelName(channel.name);
        setIsEditOpen(true);
    };

    const openDelete = (channel: Channel, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedChannel(channel);
        setIsDeleteOpen(true);
    };

    return (
        <>
            <Card className="h-fit">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                        Channels
                    </CardTitle>
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setIsCreateOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-1 p-2">
                    {/* Home Link - Points to Feed */}
                    <div className="mb-4">
                        <Link href={`/community/${communityId}`}>
                            <Button
                                variant={pathname === `/community/${communityId}` ? "secondary" : "ghost"}
                                className="w-full justify-start font-semibold text-foreground"
                            >
                                <LayoutDashboard className="w-4 h-4 mr-2 text-primary" />
                                Community Home
                            </Button>
                        </Link>
                        <div className="px-2 mt-4 mb-2">
                            <div className="h-px bg-border w-full" />
                        </div>
                    </div>
                    {channels.map((channel) => {
                        const unreadCount = notifications.filter(n =>
                            !n.read &&
                            n.type === "channel_message" &&
                            n.actionUrl?.includes(channel.id)
                        ).length;

                        return (
                            <div key={channel.id} className="group relative flex items-center">
                                <Link
                                    href={`/community/${communityId}/channel/${channel.id}`}
                                    className="flex-1"
                                >
                                    <Button
                                        variant={pathname.includes(channel.id) ? "secondary" : "ghost"}
                                        className="w-full justify-start text-muted-foreground group-hover:text-foreground pr-8 relative"
                                    >
                                        <Hash className="w-4 h-4 mr-2 opacity-70" />
                                        <span className="truncate">{channel.name}</span>
                                        {unreadCount > 0 && (
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center border-2 border-background">
                                                {unreadCount > 9 ? "9+" : unreadCount}
                                            </span>
                                        )}
                                    </Button>
                                </Link>

                                {isAdmin && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreVertical className="w-3 h-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={(e) => openEdit(channel, e)}>
                                                <Pencil className="w-4 h-4 mr-2" /> Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={(e) => openDelete(channel, e)}>
                                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        );
                    })}
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Channel</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <Label>Channel Name</Label>
                        <Input
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                            placeholder="e.g. resources"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={isLoading || !channelName.trim()}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Channel</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <Label>Channel Name</Label>
                        <Input
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate} disabled={isLoading || !channelName.trim()}>
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Channel?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-semibold text-foreground">#{selectedChannel?.name}</span>?
                            This action cannot be undone and all messages will be lost.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
