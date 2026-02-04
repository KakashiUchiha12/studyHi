'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft,
    Trash2,
    RotateCcw,
    X,
    FileText,
    Folder,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatBytes } from '@/lib/drive/storage';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TrashItem {
    id: string;
    type: 'file' | 'folder';
    name: string;
    size?: string;
    deletedAt: string;
    daysUntilPermanentDelete: number;
}

export default function TrashPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    // Fetch trash items
    const { data: trashData, isLoading } = useQuery<{ items: TrashItem[] }>({
        queryKey: ['drive-trash'],
        queryFn: async () => {
            const res = await fetch('/api/drive/trash');
            if (!res.ok) throw new Error('Failed to fetch trash');
            return res.json();
        },
        enabled: status === 'authenticated',
    });

    // Restore mutation
    const restoreMutation = useMutation({
        mutationFn: async (itemId: string) => {
            const res = await fetch('/api/drive/trash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to restore item');
            }
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: 'Success',
                description: 'Item restored successfully',
            });
            queryClient.invalidateQueries({ queryKey: ['drive-trash'] });
            queryClient.invalidateQueries({ queryKey: ['drive-files'] });
            queryClient.invalidateQueries({ queryKey: ['drive-folders'] });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Permanent delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (itemId: string) => {
            const res = await fetch('/api/drive/trash', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to delete item');
            }
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: 'Success',
                description: 'Item permanently deleted',
            });
            queryClient.invalidateQueries({ queryKey: ['drive-trash'] });
            queryClient.invalidateQueries({ queryKey: ['drive'] });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Empty trash mutation
    const emptyTrashMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/drive/trash', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emptyAll: true }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to empty trash');
            }
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: 'Success',
                description: 'Trash emptied successfully',
            });
            queryClient.invalidateQueries({ queryKey: ['drive-trash'] });
            queryClient.invalidateQueries({ queryKey: ['drive'] });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const toggleItemSelection = (id: string) => {
        setSelectedItems((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleBulkRestore = async () => {
        for (const itemId of selectedItems) {
            await restoreMutation.mutateAsync(itemId);
        }
        setSelectedItems([]);
    };

    const handleBulkDelete = async () => {
        for (const itemId of selectedItems) {
            await deleteMutation.mutateAsync(itemId);
        }
        setSelectedItems([]);
    };

    if (status === 'loading' || isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="h-32 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const items = trashData?.items || [];

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/drive">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Drive
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Trash</h1>
                        <p className="text-sm text-muted-foreground">
                            Items are permanently deleted after 30 days
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {selectedItems.length > 0 && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkRestore}
                                disabled={restoreMutation.isPending}
                            >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Restore {selectedItems.length}
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        disabled={deleteMutation.isPending}
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Delete {selectedItems.length}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Permanently delete items?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action cannot be undone. {selectedItems.length} item(s) will be
                                            permanently deleted.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleBulkDelete}>
                                            Delete Permanently
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}

                    {items.length > 0 && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={emptyTrashMutation.isPending}
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Empty Trash
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Empty trash?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete all {items.length} item(s) in trash. This
                                        action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => emptyTrashMutation.mutate()}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Empty Trash
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>

            {/* Items grid */}
            {items.length === 0 ? (
                <Card className="p-12">
                    <div className="text-center space-y-4">
                        <Trash2 className="h-16 w-16 mx-auto text-muted-foreground" />
                        <div>
                            <h3 className="text-lg font-semibold">Trash is empty</h3>
                            <p className="text-sm text-muted-foreground">
                                Deleted items will appear here
                            </p>
                        </div>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <Card
                            key={item.id}
                            className={`cursor-pointer transition-colors hover:bg-accent ${selectedItems.includes(item.id) ? 'ring-2 ring-primary' : ''
                                }`}
                            onClick={(e) => {
                                if (e.ctrlKey || e.metaKey) {
                                    toggleItemSelection(item.id);
                                }
                            }}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        {item.type === 'folder' ? (
                                            <Folder className="h-8 w-8 text-blue-500" />
                                        ) : (
                                            <FileText className="h-8 w-8 text-gray-500" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{item.name}</p>
                                            {item.size && (
                                                <p className="text-xs text-muted-foreground">
                                                    {formatBytes(Number(item.size))}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mb-3">
                                    <Badge
                                        variant={
                                            item.daysUntilPermanentDelete <= 7 ? 'destructive' : 'secondary'
                                        }
                                        className="text-xs"
                                    >
                                        {item.daysUntilPermanentDelete} days left
                                    </Badge>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            restoreMutation.mutate(item.id);
                                        }}
                                        disabled={restoreMutation.isPending}
                                    >
                                        <RotateCcw className="h-3 w-3 mr-1" />
                                        Restore
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={(e) => e.stopPropagation()}
                                                disabled={deleteMutation.isPending}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete "{item.name}". This action cannot be
                                                    undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => deleteMutation.mutate(item.id)}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                >
                                                    Delete Permanently
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Info banner */}
            {items.length > 0 && (
                <Card className="mt-6 border-blue-200 bg-blue-50">
                    <CardContent className="p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-blue-900">Auto-delete policy</p>
                            <p className="text-blue-700">
                                Items in trash are automatically deleted after 30 days. Items with less than 7
                                days remaining are highlighted in red.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
