'use client';

import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Loader2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatBytes } from '@/lib/drive/storage';
import { cn } from '@/lib/utils';

interface PublicDocument {
    id: string;
    originalName: string;
    fileSize: string;
    fileType: string;
    mimeType: string;
    downloadCount: number;
    createdAt: string;
    thumbnailPath?: string;
    thumbnailUrl?: string;
    downloadUrl?: string;
}

interface ProfileDocumentsProps {
    userId: string;
    isOwnProfile: boolean;
}

export function ProfileDocuments({ userId, isOwnProfile }: ProfileDocumentsProps) {
    // Fetch public documents
    const { data: documentsData, isLoading } = useQuery<{
        documents: PublicDocument[];
    }>({
        queryKey: ['user-public-documents', userId],
        queryFn: async () => {
            const res = await fetch(`/api/users/${userId}/documents`);
            if (!res.ok) throw new Error('Failed to fetch documents');
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Public Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const documents = documentsData?.documents || [];

    if (documents.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Public Documents</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        {isOwnProfile
                            ? 'You haven\'t shared any public documents yet'
                            : 'No public documents to display'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="rounded-none sm:rounded-xl border-x-0 sm:border-x">
            <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Public Documents
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                        <Card key={doc.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                {/* Thumbnail or icon */}
                                <div className="aspect-video bg-slate-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                    {doc.thumbnailUrl ? (
                                        <div className="relative w-full h-full">
                                            <img
                                                src={`${doc.thumbnailUrl}&v=hq`}
                                                alt={doc.originalName}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // If thumbnail fails, show icon
                                                    (e.target as any).style.display = 'none';
                                                    if ((e.target as any).nextSibling) {
                                                        (e.target as any).nextSibling.style.display = 'block';
                                                    }
                                                }}
                                            />
                                            {doc.mimeType === 'application/pdf' && (
                                                <div className="absolute top-2 left-2 pointer-events-none">
                                                    <div className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase">
                                                        PDF
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                    <FileText className={`h-12 w-12 text-slate-400 ${doc.thumbnailUrl ? 'hidden' : 'block'}`} />
                                </div>

                                {/* File info */}
                                <div className="space-y-2">
                                    <h3 className="font-medium text-sm truncate" title={doc.originalName}>
                                        {doc.originalName}
                                    </h3>

                                    <div className="flex gap-2 flex-wrap">
                                        <Badge variant="outline" className="text-xs">
                                            {doc.fileType}
                                        </Badge>
                                        <Badge variant="secondary" className="text-xs">
                                            {formatBytes(Number(doc.fileSize))}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Eye className="h-3 w-3" />
                                        <span>{doc.downloadCount} downloads</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => {
                                                window.open(doc.downloadUrl || `/api/drive/files/${doc.id}`, '_blank');
                                            }}
                                        >
                                            <Download className="h-3 w-3 mr-1" />
                                            Download
                                        </Button>
                                        {!isOwnProfile && (
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="flex-1"
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch('/api/drive/import', {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({
                                                                fromUserId: userId,
                                                                targetType: 'file',
                                                                targetId: doc.id,
                                                            }),
                                                        });
                                                        if (res.ok) {
                                                            alert('File imported to your drive!');
                                                        }
                                                    } catch (error) {
                                                        alert('Failed to import file');
                                                    }
                                                }}
                                            >
                                                Import
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
