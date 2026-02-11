"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";

interface User {
    id: string;
    name: string;
    image: string | null;
}

interface LikersDialogProps {
    isOpen: boolean;
    onClose: () => void;
    apiUrl: string;
    title?: string;
}

export function LikersDialog({ isOpen, onClose, apiUrl, title = "Liked by" }: LikersDialogProps) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchLikers();
        }
    }, [isOpen, apiUrl]);

    const fetchLikers = async () => {
        setLoading(true);
        try {
            const res = await fetch(apiUrl);
            if (res.ok) {
                setUsers(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch likers", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[400px]">
                    <div className="p-6 pt-2 space-y-4">
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : users.length === 0 ? (
                            <p className="text-center text-muted-foreground text-sm py-4">No likes yet.</p>
                        ) : (
                            users.map((user) => (
                                <Link
                                    key={user.id}
                                    href={`/profile/${user.id}`}
                                    onClick={onClose}
                                    className="flex items-center gap-3 hover:bg-muted p-2 rounded-lg transition-colors"
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user.image || ""} />
                                        <AvatarFallback>{user.name[0]?.toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{user.name}</span>
                                </Link>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
