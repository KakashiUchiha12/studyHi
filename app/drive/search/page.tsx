'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft,
    Search,
    FileText,
    Folder,
    Download,
    Filter,
    Calendar,
    FileType,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBytes } from '@/lib/drive/storage';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface SearchResult {
    id: string;
    type: 'file' | 'folder';
    name: string;
    size?: string;
    mimeType?: string;
    fileType?: string;
    isPublic: boolean;
    createdAt: string;
    path?: string;
}

export default function SearchPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [fileType, setFileType] = useState(searchParams.get('type') || 'all');
    const [dateFilter, setDateFilter] = useState(searchParams.get('date') || 'all');

    // Redirect if not authenticated
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    // Fetch search results
    const { data: searchData, isLoading } = useQuery<{
        results: SearchResult[];
        total: number;
    }>({
        queryKey: ['drive-search', query, fileType, dateFilter],
        queryFn: async () => {
            const url = new URL('/api/drive/search', window.location.origin);
            if (query) url.searchParams.set('q', query);
            if (fileType !== 'all') url.searchParams.set('type', fileType);
            if (dateFilter !== 'all') url.searchParams.set('date', dateFilter);

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to search');
            return res.json();
        },
        enabled: status === 'authenticated' && query.length > 0,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const url = new URL(window.location.href);
        url.searchParams.set('q', query);
        if (fileType !== 'all') url.searchParams.set('type', fileType);
        if (dateFilter !== 'all') url.searchParams.set('date', dateFilter);
        router.push(url.pathname + url.search);
    };

    const results = searchData?.results || [];
    const total = searchData?.total || 0;

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
                <Link href="/drive">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Drive
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Search Drive</h1>
                    <p className="text-sm text-muted-foreground">
                        Find files and folders in your drive
                    </p>
                </div>
            </div>

            {/* Search form */}
            <Card className="mb-6">
                <CardContent className="p-6">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="flex gap-2">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search files and folders..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button type="submit">Search</Button>
                        </div>

                        {/* Filters */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <FileType className="h-4 w-4" />
                                    File Type
                                </label>
                                <Select value={fileType} onValueChange={setFileType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="document">Documents</SelectItem>
                                        <SelectItem value="image">Images</SelectItem>
                                        <SelectItem value="video">Videos</SelectItem>
                                        <SelectItem value="audio">Audio</SelectItem>
                                        <SelectItem value="archive">Archives</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1">
                                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Date
                                </label>
                                <Select value={dateFilter} onValueChange={setDateFilter}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Time</SelectItem>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="week">This Week</SelectItem>
                                        <SelectItem value="month">This Month</SelectItem>
                                        <SelectItem value="year">This Year</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Results */}
            {query.length === 0 ? (
                <Card className="p-12">
                    <div className="text-center space-y-4">
                        <Search className="h-16 w-16 mx-auto text-muted-foreground" />
                        <div>
                            <h3 className="text-lg font-semibold">Start searching</h3>
                            <p className="text-sm text-muted-foreground">
                                Enter a search query to find files and folders
                            </p>
                        </div>
                    </div>
                </Card>
            ) : isLoading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
            ) : results.length === 0 ? (
                <Card className="p-12">
                    <div className="text-center space-y-4">
                        <Search className="h-16 w-16 mx-auto text-muted-foreground" />
                        <div>
                            <h3 className="text-lg font-semibold">No results found</h3>
                            <p className="text-sm text-muted-foreground">
                                Try different keywords or filters
                            </p>
                        </div>
                    </div>
                </Card>
            ) : (
                <>
                    <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Found {total} result{total !== 1 ? 's' : ''}
                        </p>
                    </div>

                    <div className="space-y-3">
                        {results.map((result) => (
                            <Card
                                key={result.id}
                                className="cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => {
                                    if (result.type === 'folder') {
                                        router.push(`/drive?folderId=${result.id}`);
                                    }
                                }}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                        {/* Icon */}
                                        {result.type === 'folder' ? (
                                            <Folder className="h-8 w-8 text-blue-500 mt-1" />
                                        ) : (
                                            <FileText className="h-8 w-8 text-gray-500 mt-1" />
                                        )}

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className="font-medium truncate">{result.name}</p>
                                                    {result.path && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {result.path}
                                                        </p>
                                                    )}
                                                </div>
                                                {result.type === 'file' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            window.location.href = `/api/drive/files/${result.id}`;
                                                        }}
                                                    >
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download
                                                    </Button>
                                                )}
                                            </div>

                                            {/* Metadata */}
                                            <div className="flex gap-2 mt-2">
                                                {result.isPublic && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        Public
                                                    </Badge>
                                                )}
                                                {result.fileType && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {result.fileType}
                                                    </Badge>
                                                )}
                                                {result.size && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {formatBytes(Number(result.size))}
                                                    </Badge>
                                                )}
                                                <Badge variant="outline" className="text-xs">
                                                    {new Date(result.createdAt).toLocaleDateString()}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
