'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, FileText, Download, Copy, Filter, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatBytes } from '@/lib/drive/storage';
import { useToast } from '@/hooks/use-toast';

interface PublicDocument {
    id: string;
    originalName: string;
    fileSize: string;
    fileType: string;
    mimeType: string;
    downloadCount: number;
    thumbnailPath?: string;
    user: {
        id: string;
        name: string;
        image?: string;
    };
    subject?: {
        id: string;
        name: string;
        color: string;
    };
}

export function FeedDocumentSearch() {
    const { toast } = useToast();
    const [query, setQuery] = useState('');
    const [fileType, setFileType] = useState('all');
    const [subjectFilter, setSubjectFilter] = useState('all');

    // Fetch public documents
    const { data: documentsData, isLoading } = useQuery<{
        documents: PublicDocument[];
        total: number;
    }>({
        queryKey: ['feed-documents', query, fileType, subjectFilter],
        queryFn: async () => {
            const url = new URL('/api/feed/documents', window.location.origin);
            if (query) url.searchParams.set('q', query);
            if (fileType !== 'all') url.searchParams.set('type', fileType);
            if (subjectFilter !== 'all') url.searchParams.set('subject', subjectFilter);

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch documents');
            return res.json();
        },
    });

    const handleImport = async (doc: PublicDocument) => {
        try {
            const res = await fetch('/api/drive/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromUserId: doc.user.id,
                    targetType: 'file',
                    targetId: doc.id,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to import');
            }

            toast({
                title: 'Success',
                description: 'Document imported to your drive',
            });
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        }
    };

    const documents = documentsData?.documents || [];
    const total = documentsData?.total || 0;

    return (
        <div className="space-y-4">
            {/* Search Header */}
            <Card>
                <CardContent className="p-4">
                    <div className="space-y-4">
                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search public documents..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2">
                            <Select value={fileType} onValueChange={setFileType}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="File Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="document">Documents</SelectItem>
                                    <SelectItem value="image">Images</SelectItem>
                                    <SelectItem value="video">Videos</SelectItem>
                                    <SelectItem value="audio">Audio</SelectItem>
                                    <SelectItem value="archive">Archives</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Subjects</SelectItem>
                                    {/* Add dynamic subjects here */}
                                </SelectContent>
                            </Select>
                        </div>

                        {total > 0 && (
                            <p className="text-sm text-muted-foreground">
                                Found {total} public document{total !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Documents Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-4">
                                <div className="aspect-video bg-slate-200 rounded-lg mb-3" />
                                <div className="h-4 bg-slate-200 rounded mb-2" />
                                <div className="h-3 bg-slate-200 rounded w-2/3" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : documents.length === 0 ? (
                <Card className="p-12">
                    <div className="text-center space-y-4">
                        <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                        <div>
                            <h3 className="text-lg font-semibold">No documents found</h3>
                            <p className="text-sm text-muted-foreground">
                                {query
                                    ? 'Try different search terms or filters'
                                    : 'No public documents available yet'}
                            </p>
                        </div>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                        <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-4">
                                {/* Thumbnail */}
                                <div className="aspect-video bg-slate-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                    {doc.thumbnailPath ? (
                                        <img
                                            src={doc.thumbnailPath}
                                            alt={doc.originalName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <FileText className="h-12 w-12 text-slate-400" />
                                    )}
                                </div>

                                {/* File Info */}
                                <div className="space-y-2">
                                    <h3 className="font-medium text-sm truncate" title={doc.originalName}>
                                        {doc.originalName}
                                    </h3>

                                    {/* User Info */}
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200 overflow-hidden">
                                            {doc.user.image ? (
                                                <img
                                                    src={doc.user.image}
                                                    alt={doc.user.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <User className="w-full h-full p-1 text-slate-400" />
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground truncate">
                                            {doc.user.name}
                                        </span>
                                    </div>

                                    {/* Metadata */}
                                    <div className="flex gap-2 flex-wrap">
                                        <Badge variant="outline" className="text-xs">
                                            {doc.fileType}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                            {formatBytes(Number(doc.fileSize))}
                                        </Badge>
                                        {doc.subject && (
                                            <Badge
                                                variant="outline"
                                                className="text-xs"
                                                style={{ borderColor: doc.subject.color }}
                                            >
                                                {doc.subject.name}
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="text-xs text-muted-foreground">
                                        {doc.downloadCount} downloads
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => handleImport(doc)}
                                        >
                                            <Download className="h-3 w-3 mr-1" />
                                            Save to Drive
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="flex-1"
                                            onClick={() => handleImport(doc)}
                                        >
                                            <Copy className="h-3 w-3 mr-1" />
                                            Import
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
