'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Upload,
  FolderPlus,
  Search,
  Trash2,
  Activity,
  FileText,
  Folder,
  MoreVertical,
  Download,
  Share2,
  Copy,
  Move,
  Edit,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { formatBytes } from '@/lib/drive/storage';

interface DriveInfo {
  id: string;
  storageUsed: string;
  storageLimit: string;
  storagePercentage: number;
  fileCount: number;
  folderCount: number;
}

interface DriveFile {
  id: string;
  originalName: string;
  fileSize: string;
  mimeType: string;
  fileType: string;
  isPublic: boolean;
  downloadCount: number;
  createdAt: string;
  folder?: {
    id: string;
    name: string;
    path: string;
  };
}

interface DriveFolder {
  id: string;
  name: string;
  path: string;
  isPublic: boolean;
  createdAt: string;
  _count?: {
    files: number;
    children: number;
  };
}

export default function DrivePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const folderId = searchParams.get('folderId');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch drive info
  const { data: driveData, isLoading: driveLoading } = useQuery<{ drive: DriveInfo }>({
    queryKey: ['drive'],
    queryFn: async () => {
      const res = await fetch('/api/drive');
      if (!res.ok) throw new Error('Failed to fetch drive info');
      return res.json();
    },
    enabled: status === 'authenticated',
  });

  // Fetch files
  const { data: filesData, isLoading: filesLoading } = useQuery<{
    files: DriveFile[];
    pagination: any;
  }>({
    queryKey: ['drive-files', folderId],
    queryFn: async () => {
      const url = new URL('/api/drive/files', window.location.origin);
      if (folderId) url.searchParams.set('folderId', folderId);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch files');
      return res.json();
    },
    enabled: status === 'authenticated',
  });

  // Fetch folders
  const { data: foldersData, isLoading: foldersLoading } = useQuery<{
    folders: DriveFolder[];
    pagination: any;
  }>({
    queryKey: ['drive-folders', folderId],
    queryFn: async () => {
      const url = new URL('/api/drive/folders', window.location.origin);
      if (folderId) url.searchParams.set('parentId', folderId);
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch folders');
      return res.json();
    },
    enabled: status === 'authenticated',
  });

  // Get current folder info
  const { data: currentFolderData } = useQuery<{ folder: DriveFolder }>({
    queryKey: ['drive-folder', folderId],
    queryFn: async () => {
      const res = await fetch(`/api/drive/folders/${folderId}`);
      if (!res.ok) throw new Error('Failed to fetch folder');
      return res.json();
    },
    enabled: !!folderId && status === 'authenticated',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);

    try {
      const res = await fetch('/api/drive/files', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload file');
      }

      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['drive-files'] });
      queryClient.invalidateQueries({ queryKey: ['drive'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    try {
      const res = await fetch('/api/drive/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'delete',
          itemIds: selectedItems,
          itemType: 'file', // Simplified - in production, track item types
        }),
      });

      if (!res.ok) throw new Error('Failed to delete items');

      toast({
        title: 'Success',
        description: `${selectedItems.length} item(s) moved to trash`,
      });

      setSelectedItems([]);
      queryClient.invalidateQueries({ queryKey: ['drive-files'] });
      queryClient.invalidateQueries({ queryKey: ['drive-folders'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (status === 'loading' || driveLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
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

  const drive = driveData?.drive;
  const files = filesData?.files || [];
  const folders = foldersData?.folders || [];
  const currentFolder = currentFolderData?.folder;

  // Build breadcrumb path
  const breadcrumbPath = currentFolder
    ? currentFolder.path.split('/').filter(Boolean)
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Storage indicator */}
      {drive && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Drive</CardTitle>
              <div className="flex gap-2">
                <Link href="/drive/search">
                  <Button variant="outline" size="sm">
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </Link>
                <Link href="/drive/trash">
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Trash
                  </Button>
                </Link>
                <Link href="/drive/activity">
                  <Button variant="outline" size="sm">
                    <Activity className="h-4 w-4 mr-2" />
                    Activity
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>
                  {formatBytes(Number(drive.storageUsed))} of{' '}
                  {formatBytes(Number(drive.storageLimit))} used
                </span>
                <span>{drive.storagePercentage}%</span>
              </div>
              <Progress value={drive.storagePercentage} />
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{drive.fileCount} files</span>
                <span>{drive.folderCount} folders</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breadcrumb navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/drive">
                <Home className="h-4 w-4" />
              </BreadcrumbLink>
            </BreadcrumbItem>
            {breadcrumbPath.map((segment, index) => (
              <div key={index} className="flex items-center">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === breadcrumbPath.length - 1 ? (
                    <BreadcrumbPage>{segment}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={`/drive?folderId=${currentFolder?.id}`}>
                      {segment}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex gap-2">
          {selectedItems.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedItems.length}
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <label>
              <Upload className="h-4 w-4 mr-2" />
              Upload
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </Button>
        </div>
      </div>

      {/* Files and folders grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {foldersLoading &&
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}

        {folders.map((folder) => (
          <Card
            key={folder.id}
            className={`cursor-pointer transition-colors hover:bg-accent ${
              selectedItems.includes(folder.id) ? 'ring-2 ring-primary' : ''
            }`}
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey) {
                toggleItemSelection(folder.id);
              } else {
                router.push(`/drive?folderId=${folder.id}`);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Folder className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="font-medium truncate">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {folder._count?.files || 0} files
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {folder.isPublic && (
                <Badge variant="secondary" className="mt-2">
                  Public
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}

        {filesLoading &&
          [...Array(8)].map((_, i) => <Skeleton key={i} className="h-32" />)}

        {files.map((file) => (
          <Card
            key={file.id}
            className={`cursor-pointer transition-colors hover:bg-accent ${
              selectedItems.includes(file.id) ? 'ring-2 ring-primary' : ''
            }`}
            onClick={(e) => {
              if (e.ctrlKey || e.metaKey) {
                toggleItemSelection(file.id);
              }
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-gray-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.originalName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(Number(file.fileSize))}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Move className="h-4 w-4 mr-2" />
                      Move
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex gap-2 mt-2">
                {file.isPublic && (
                  <Badge variant="secondary" className="text-xs">
                    Public
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {file.fileType}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {!filesLoading &&
        !foldersLoading &&
        files.length === 0 &&
        folders.length === 0 && (
          <Card className="p-12">
            <div className="text-center space-y-4">
              <Folder className="h-16 w-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No files or folders</h3>
                <p className="text-sm text-muted-foreground">
                  Upload files or create folders to get started
                </p>
              </div>
              <Button asChild>
                <label>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>
              </Button>
            </div>
          </Card>
        )}
    </div>
  );
}
