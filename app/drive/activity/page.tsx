'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    Upload,
    Download,
    Trash2,
    FolderPlus,
    Copy,
    RotateCcw,
    FileText,
    Folder,
    Users,
    Clock,
    LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatBytes } from '@/lib/drive/storage';

interface Activity {
    id: string;
    action: string;
    targetType: 'file' | 'folder';
    targetName: string;
    metadata?: any;
    createdAt: string;
    user?: {
        name: string;
        image?: string;
    };
}

const activityIcons: Record<string, any> = {
    upload: Upload,
    download: Download,
    delete: Trash2,
    restore: RotateCcw,
    create_folder: FolderPlus,
    copy: Copy,
    import: Users,
};

const activityColors: Record<string, string> = {
    upload: 'text-green-600',
    download: 'text-blue-600',
    delete: 'text-destructive',
    restore: 'text-purple-600',
    create_folder: 'text-yellow-600',
    copy: 'text-cyan-600',
    import: 'text-pink-600',
};

const activityLabels: Record<string, string> = {
    upload: 'Uploaded',
    download: 'Downloaded',
    delete: 'Deleted',
    restore: 'Restored',
    create_folder: 'Created folder',
    copy: 'Copied',
    import: 'Imported',
};

function formatTimeAgo(date: string): string {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return past.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

export default function ActivityPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('all');

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    // Fetch activity data
    const actionMap: Record<string, string> = {
        all: 'all',
        uploads: 'upload',
        downloads: 'download',
        deletions: 'delete',
    };

    const { data: activityData, isLoading } = useQuery<{
        activities: Activity[];
        stats: {
            all: number;
            uploads: number;
            downloads: number;
            deletions: number;
        };
        pagination: any;
    }>({
        queryKey: ['drive-activity', activeTab],
        queryFn: async () => {
            const action = actionMap[activeTab];
            const res = await fetch(`/api/drive/activity?action=${action}`);
            if (!res.ok) throw new Error('Failed to fetch activity');
            return res.json();
        },
        enabled: status === 'authenticated',
    });

    if (status === 'loading' || isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    const renderActivityList = (activities: Activity[]) => {
        if (activities.length === 0) {
            return (
                <Card className="p-12 border-dashed">
                    <div className="text-center space-y-4">
                        <Clock className="h-16 w-16 mx-auto text-muted-foreground opacity-20" />
                        <div>
                            <h3 className="text-lg font-semibold">No activity yet</h3>
                            <p className="text-sm text-muted-foreground">
                                Your drive activity will appear here
                            </p>
                        </div>
                    </div>
                </Card>
            );
        }

        return (
            <div className="space-y-3">
                {activities.map((activity) => {
                    const Icon = activityIcons[activity.action] || FileText;
                    const color = activityColors[activity.action] || 'text-gray-600';
                    const label = activityLabels[activity.action] || activity.action;
                    const metadata = typeof activity.metadata === 'string'
                        ? JSON.parse(activity.metadata)
                        : activity.metadata;

                    return (
                        <Card key={activity.id} className="hover:bg-accent/50 transition-colors border-none bg-muted/20">
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className={`mt-1 p-2 rounded-full bg-background ring-1 ring-border ${color}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm font-semibold">{label}</span>
                                                    <span className="text-xs text-muted-foreground">•</span>
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        {activity.targetType === 'folder' ? (
                                                            <Folder className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                                        ) : (
                                                            <FileText className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                                                        )}
                                                        <span className="text-sm text-foreground font-medium truncate" title={activity.targetName}>
                                                            {activity.targetName}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                    {metadata?.fileSize && (
                                                        <span>{formatBytes(Number(metadata.fileSize))}</span>
                                                    )}
                                                    {metadata?.mimeType && (
                                                        <Badge variant="outline" className="text-[10px] py-0 h-4 uppercase font-bold">
                                                            {metadata.mimeType.split('/')[1] || metadata.mimeType}
                                                        </Badge>
                                                    )}
                                                    {metadata?.path && (
                                                        <span className="truncate max-w-[200px]" title={metadata.path}>
                                                            in {metadata.path}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end uppercase font-bold tracking-wider">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {formatTimeAgo(activity.createdAt)}
                                                </p>
                                                {activity.user && (
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                                        by {activity.user.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        );
    };

    const allActivities = activityData?.activities || [];
    const stats = activityData?.stats || { all: 0, uploads: 0, downloads: 0, deletions: 0 };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard">
                        <Button variant="outline" size="sm" className="h-8 rounded-full border-dashed">
                            <LayoutDashboard className="h-3.5 w-3.5 mr-2" />
                            Dashboard
                        </Button>
                    </Link>
                    <Link href="/drive">
                        <Button variant="ghost" size="sm" className="h-8 rounded-full hover:bg-accent/50">
                            <ArrowLeft className="h-3.5 w-3.5 mr-2" />
                            Back to Drive
                        </Button>
                    </Link>
                </div>
                <div className="text-right">
                    <h1 className="text-2xl font-bold tracking-tight">Activity</h1>
                    <p className="text-xs text-muted-foreground">
                        Track all your drive storage actions
                    </p>
                </div>
            </div>

            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-muted/50 p-1 h-11 rounded-xl">
                        <TabsTrigger value="all" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            All
                            <Badge variant="secondary" className="ml-1.5 px-1 text-[10px] opacity-60">
                                {stats.all}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="uploads" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            Uploads
                            <Badge variant="secondary" className="ml-1.5 px-1 text-[10px] opacity-60">
                                {stats.uploads}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="downloads" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            Downloads
                            <Badge variant="secondary" className="ml-1.5 px-1 text-[10px] opacity-60">
                                {stats.downloads}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="deletions" className="rounded-lg px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            Deletions
                            <Badge variant="secondary" className="ml-1.5 px-1 text-[10px] opacity-60">
                                {stats.deletions}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="mt-2 text-foreground">
                    <TabsContent value="all" className="focus-visible:outline-none">{renderActivityList(allActivities)}</TabsContent>
                    <TabsContent value="uploads" className="focus-visible:outline-none">{renderActivityList(allActivities)}</TabsContent>
                    <TabsContent value="downloads" className="focus-visible:outline-none">{renderActivityList(allActivities)}</TabsContent>
                    <TabsContent value="deletions" className="focus-visible:outline-none">{renderActivityList(allActivities)}</TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
