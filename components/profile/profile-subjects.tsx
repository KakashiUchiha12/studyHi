'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Download, Copy, Loader2 } from 'lucide-react';
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
}

export function ProfileSubjects({ userId, isOwnProfile }: ProfileSubjectsProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [importDialogOpen, setImportDialogOpen] = useState(false);
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
            toast({
                title: 'Success',
                description: `Imported ${data.imported} file(s). ${data.duplicates || 0} duplicate(s) skipped.`,
            });
            setImportDialogOpen(false);
            setSelectedSubject(null);
            setSelectedFiles([]);
            queryClient.invalidateQueries({ queryKey: ['drive-files'] });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const handleImportClick = (subject: Subject) => {
        setSelectedSubject(subject);
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
                        {isOwnProfile ? 'You haven\'t added any subjects yet' : 'No subjects to display'}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card className="rounded-none sm:rounded-xl border-x-0 sm:border-x">
                <CardHeader className="px-4 sm:px-6">
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Subjects
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {subjects.map((subject) => (
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
            </Card>

            {/* Import Dialog */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Import from {selectedSubject?.name}</DialogTitle>
                        <DialogDescription>
                            Select files to import to your drive. Duplicate files will be automatically
                            detected and skipped.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {filesData?.files.map((file) => (
                            <div
                                key={file.id}
                                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent"
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
                                        {file.fileType} • {file.fileSize}
                                    </p>
                                </div>
                            </div>
                        ))}
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
                            disabled={selectedFiles.length === 0 || importMutation.isPending}
                        >
                            {importMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Import {selectedFiles.length} file(s)
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
