"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface UserListDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    type: "followers" | "following";
}

export function UserListDialog({ open, onOpenChange, userId, type }: UserListDialogProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchUsers();
        }
    }, [open, userId, type]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/users/${userId}/${type}`);
            if (res.ok) {
                setUsers(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="capitalize">{type}</DialogTitle>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="animate-spin text-muted-foreground" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center p-4 text-muted-foreground">
                            No users found.
                        </div>
                    ) : (
                        users.map((user) => (
                            <div key={user.id} className="flex items-center gap-3">
                                <Link href={`/profile/${user.id}`} onClick={() => onOpenChange(false)}>
                                    <Avatar>
                                        <AvatarImage src={user.image || ""} />
                                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div className="flex-1 overflow-hidden">
                                    <Link href={`/profile/${user.id}`} onClick={() => onOpenChange(false)} className="font-medium hover:underline block truncate">
                                        {user.name}
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
