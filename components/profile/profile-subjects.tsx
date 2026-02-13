'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { BookOpen, Download, Copy, Loader2, CheckCircle2, AlertCircle, XCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Subject {
    id: string;
    name: string;
    color: string;
    description?: string;
    _count?: {
        files: number;
        chapters: number;
    };
}

interface ProfileSubjectsProps {
    userId: string;
    isOwnProfile: boolean;
    limit?: number;
}

interface ImportReport {
    importedCount: number;
    duplicatesCount: number;
    skippedCount: number;
    skippedDetails: Array<{ name: string; reason: string }>;
}

export function ProfileSubjects({ userId, isOwnProfile, limit }: ProfileSubjectsProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
    const [importReport, setImportReport] = useState<ImportReport | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

    // Fetch user's subjects
    const { data: subjectsData, isLoading } = useQuery<{ subjects: Subject[] }>({
        queryKey: ['user-subjects', userId],
        queryFn: async () => {
            const res = await fetch(`/api/users/${userId}/subjects`);
            if (!res.ok) throw new Error('Failed to fetch subjects');
            return res.json();
        },
    });

    // Fetch subject files for import dialog
    const { data: filesData } = useQuery<{ files: any[] }>({
        queryKey: ['subject-files', selectedSubject?.id],
        queryFn: async () => {
            const res = await fetch(`/api/subjects/${selectedSubject?.id}/files`);
            if (!res.ok) throw new Error('Failed to fetch files');
            return res.json();
        },
        enabled: !!selectedSubject,
    });

    // Import mutation
    const importMutation = useMutation({
        mutationFn: async (data: { subjectId: string; fileIds: string[] }) => {
            const res = await fetch('/api/drive/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromUserId: userId,
                    targetType: 'subject',
                    targetId: data.subjectId,
                    fileIds: data.fileIds,
                }),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to import');
            }
            return res.json();
        },
        onSuccess: (data) => {
            setImportReport({
                importedCount: data.importedCount,
                duplicatesCount: data.duplicatesCount,
                skippedCount: data.skippedCount,
                skippedDetails: data.skippedDetails || [],
            });
            setImportDialogOpen(false);
            setSummaryDialogOpen(true);
            setSelectedSubject(null);
            setSelectedFiles([]);
            queryClient.invalidateQueries({ queryKey: ['drive-files'] });
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
        onError: (error: Error) => {
            toast({
                title: 'Import Failed',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const handleImportClick = (subject: Subject) => {
        setSelectedSubject(subject);
        setSelectedFiles([]);
        setImportDialogOpen(true);
    };

    const handleImport = () => {
        if (!selectedSubject) return;
        importMutation.mutate({
            subjectId: selectedSubject.id,
            fileIds: selectedFiles,
        });
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const subjects = subjectsData?.subjects || [];

    if (subjects.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        {isOwnProfile ? "You haven't added any subjects yet" : 'No subjects to display'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            {/* Loading Overlay */}
            {importMutation.isPending && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="bg-card p-8 rounded-xl shadow-2xl border flex flex-col items-center max-w-sm w-full mx-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                        <h2 className="text-xl font-bold mb-2">Importing Subject...</h2>
                        <p className="text-sm text-muted-foreground text-center">
                            We are copying the chapters, materials, and files from <strong>{selectedSubject?.name}</strong> to your drive. This may take a moment.
                        </p>
                    </div>
                </div>
            )}

            <Card className="rounded-none sm:rounded-xl border-x-0 sm:border-x">
                <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Subjects
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(limit ? subjects.slice(0, limit) : subjects).map((subject) => (
                            <Card key={subject.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: subject.color }}
                                                />
                                                <h3 className="font-semibold">{subject.name}</h3>
                                            </div>
                                            {subject.description && (
                                                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                                    {subject.description}
                                                </p>
                                            )}
                                            <div className="flex gap-2">
                                                {subject._count?.files !== undefined && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {subject._count.files} files
                                                    </Badge>
                                                )}
                                                {subject._count?.chapters !== undefined && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {subject._count.chapters} chapters
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                        {!isOwnProfile && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleImportClick(subject)}
                                                className="ml-2"
                                            >
                                                <Copy className="h-3 w-3 mr-1" />
                                                Import
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
                {limit && subjects.length > limit && (
                    <div className="px-6 pb-6 pt-0 flex justify-center">
                        <Button variant="ghost" size="sm" asChild className="text-sm">
                            <Link href={`/profile/${userId}/subjects`}>
                                See All Subjects
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                )}
            </Card>

            {/* Import Dialog */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Import from {selectedSubject?.name}</DialogTitle>
                        <DialogDescription>
                            Select specific files to import, or click "Import All" below. Duplicate files will be automatically
                            detected and skipped during the process.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-muted/50 p-3 rounded-lg">
                            <span className="text-sm font-medium">
                                {selectedFiles.length} item(s) selected
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedFiles(filesData?.files.map(f => f.id) || [])}
                                >
                                    Select All
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedFiles([])}
                                >
                                    Clear
                                </Button>
                            </div>
                        </div>

                        <ScrollArea className="h-64 rounded-md border p-4">
                            {filesData?.files && filesData.files.length > 0 ? (
                                <div className="space-y-2">
                                    {filesData.files.map((file) => (
                                        <div
                                            key={file.id}
                                            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                                            onClick={() => {
                                                if (selectedFiles.includes(file.id)) {
                                                    setSelectedFiles(selectedFiles.filter((id) => id !== file.id));
                                                } else {
                                                    setSelectedFiles([...selectedFiles, file.id]);
                                                }
                                            }}
                                        >
                                            <Checkbox
                                                checked={selectedFiles.includes(file.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setSelectedFiles([...selectedFiles, file.id]);
                                                    } else {
                                                        setSelectedFiles(selectedFiles.filter((id) => id !== file.id));
                                                    }
                                                }}
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{file.originalName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {file.fileType} • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                    <BookOpen className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">No standalone files found in this subject.</p>
                                    <p className="text-xs text-muted-foreground">Chapters and materials will still be imported.</p>
                                </div>
                            )}
                        </ScrollArea>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setImportDialogOpen(false);
                                setSelectedFiles([]);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={importMutation.isPending}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            {selectedFiles.length > 0
                                ? `Import ${selectedFiles.length} file(s) & content`
                                : "Import Subject Content"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Success Summary Dialog */}
            <Dialog open={summaryDialogOpen} onOpenChange={setSummaryDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <div className="flex justify-center mb-4">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        </div>
                        <DialogTitle className="text-center text-xl">Import Successful!</DialogTitle>
                        <DialogDescription className="text-center">
                            The subject content has been successfully copied to your drive.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-muted/50 p-4 rounded-xl space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="bg-background p-3 rounded-lg border">
                                <p className="text-2xl font-bold text-green-600">{importReport?.importedCount}</p>
                                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Imported</p>
                            </div>
                            <div className="bg-background p-3 rounded-lg border">
                                <p className="text-2xl font-bold text-amber-600">{importReport?.duplicatesCount}</p>
                                <p className="text-[10px] uppercase font-semibold text-muted-foreground">Skipped</p>
                            </div>
                        </div>

                        {importReport?.skippedCount !== undefined && importReport.skippedCount > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-semibold flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 text-amber-500" />
                                    Skipped Items Reason:
                                </p>
                                <ScrollArea className="max-h-32 rounded-md">
                                    <div className="space-y-1 pr-4">
                                        {importReport.skippedDetails.map((detail, idx) => (
                                            <div key={idx} className="text-[11px] flex justify-between gap-2 p-1 border-b last:border-0">
                                                <span className="font-medium truncate max-w-[150px]">{detail.name}</span>
                                                <span className="text-muted-foreground">{detail.reason}</span>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            className="w-full"
                            onClick={() => setSummaryDialogOpen(false)}
                        >
                            Awesome!
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
