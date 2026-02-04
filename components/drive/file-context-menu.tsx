'use client';

import { useState } from 'react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
    Download,
    Edit,
    Copy,
    Move,
    Share2,
    Trash2,
    Info,
    Star,
    FolderOpen,
} from 'lucide-react';

interface FileContextMenuProps {
    children: React.ReactNode;
    item: {
        id: string;
        type: 'file' | 'folder';
        name: string;
    };
    onDownload?: () => void;
    onRename?: () => void;
    onCopy?: () => void;
    onMove?: () => void;
    onShare?: () => void;
    onDelete?: () => void;
    onInfo?: () => void;
    onFavorite?: () => void;
    onOpen?: () => void;
}

export function FileContextMenu({
    children,
    item,
    onDownload,
    onRename,
    onCopy,
    onMove,
    onShare,
    onDelete,
    onInfo,
    onFavorite,
    onOpen,
}: FileContextMenuProps) {
    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-56">
                {item.type === 'folder' && onOpen && (
                    <>
                        <ContextMenuItem onClick={onOpen}>
                            <FolderOpen className="mr-2 h-4 w-4" />
                            Open
                        </ContextMenuItem>
                        <ContextMenuSeparator />
                    </>
                )}

                {item.type === 'file' && onDownload && (
                    <ContextMenuItem onClick={onDownload}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                    </ContextMenuItem>
                )}

                {onRename && (
                    <ContextMenuItem onClick={onRename}>
                        <Edit className="mr-2 h-4 w-4" />
                        Rename
                    </ContextMenuItem>
                )}

                {onCopy && (
                    <ContextMenuItem onClick={onCopy}>
                        <Copy className="mr-2 h-4 w-4" />
                        Make a copy
                    </ContextMenuItem>
                )}

                {onMove && (
                    <ContextMenuItem onClick={onMove}>
                        <Move className="mr-2 h-4 w-4" />
                        Move to...
                    </ContextMenuItem>
                )}

                {onShare && (
                    <>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={onShare}>
                            <Share2 className="mr-2 h-4 w-4" />
                            Share
                        </ContextMenuItem>
                    </>
                )}

                {onFavorite && (
                    <ContextMenuItem onClick={onFavorite}>
                        <Star className="mr-2 h-4 w-4" />
                        Add to favorites
                    </ContextMenuItem>
                )}

                {onInfo && (
                    <>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={onInfo}>
                            <Info className="mr-2 h-4 w-4" />
                            File information
                        </ContextMenuItem>
                    </>
                )}

                {onDelete && (
                    <>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={onDelete} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </ContextMenuItem>
                    </>
                )}
            </ContextMenuContent>
        </ContextMenu>
    );
}
