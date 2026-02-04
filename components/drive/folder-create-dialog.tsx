'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface FolderCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    parentId?: string | null;
    onSuccess?: () => void;
}

export function FolderCreateDialog({
    open,
    onOpenChange,
    parentId,
    onSuccess,
}: FolderCreateDialogProps) {
    const [folderName, setFolderName] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const createFolderMutation = useMutation({
        mutationFn: async (data: { name: string; parentId?: string | null; isPublic: boolean }) => {
            const res = await fetch('/api/drive/folders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create folder');
            }

            return res.json();
        },
        onSuccess: () => {
            toast({
                title: 'Success',
                description: 'Folder created successfully',
            });

            // Invalidate queries to refresh the folder list
            queryClient.invalidateQueries({ queryKey: ['drive-folders'] });
            queryClient.invalidateQueries({ queryKey: ['drive'] });

            // Reset form and close dialog
            setFolderName('');
            setIsPublic(false);
            onOpenChange(false);
            onSuccess?.();
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!folderName.trim()) {
            toast({
                title: 'Error',
                description: 'Folder name is required',
                variant: 'destructive',
            });
            return;
        }

        createFolderMutation.mutate({
            name: folderName.trim(),
            parentId: parentId || null,
            isPublic,
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create New Folder</DialogTitle>
                        <DialogDescription>
                            Create a new folder to organize your files.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="folder-name">Folder Name</Label>
                            <Input
                                id="folder-name"
                                placeholder="Enter folder name"
                                value={folderName}
                                onChange={(e) => setFolderName(e.target.value)}
                                disabled={createFolderMutation.isPending}
                                autoFocus
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="is-public">Public Folder</Label>
                                <p className="text-sm text-muted-foreground">
                                    Allow others to view this folder
                                </p>
                            </div>
                            <Switch
                                id="is-public"
                                checked={isPublic}
                                onCheckedChange={setIsPublic}
                                disabled={createFolderMutation.isPending}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={createFolderMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={createFolderMutation.isPending}>
                            {createFolderMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Create Folder
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
