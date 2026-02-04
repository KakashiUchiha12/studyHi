'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DragDropUploadProps {
    onUpload: (files: File[]) => void;
    maxSize?: number; // in bytes
    accept?: Record<string, string[]>;
    multiple?: boolean;
    disabled?: boolean;
}

export function DragDropUpload({
    onUpload,
    maxSize = 500 * 1024 * 1024, // 500MB default
    accept,
    multiple = true,
    disabled = false,
}: DragDropUploadProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                onUpload(acceptedFiles);
            }
        },
        [onUpload]
    );

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        maxSize,
        accept,
        multiple,
        disabled,
    });

    return (
        <Card
            {...getRootProps()}
            className={cn(
                'border-2 border-dashed transition-colors cursor-pointer',
                isDragActive && 'border-primary bg-primary/5',
                isDragReject && 'border-destructive bg-destructive/5',
                disabled && 'opacity-50 cursor-not-allowed'
            )}
        >
            <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                <input {...getInputProps()} />

                {isDragActive ? (
                    <>
                        <Upload className="h-12 w-12 text-primary mb-4 animate-bounce" />
                        <p className="text-lg font-medium text-primary">Drop files here</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Release to upload
                        </p>
                    </>
                ) : (
                    <>
                        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium">Drag & drop files here</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground mt-4">
                            Max file size: {Math.round(maxSize / (1024 * 1024))}MB
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
