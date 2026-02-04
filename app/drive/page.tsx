'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  LayoutDashboard,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { FolderCreateDialog } from '@/components/drive/folder-create-dialog';

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
  subjectId?: string;
  _count?: {
    files: number;
    children: number;
  };
  breadcrumbs?: { id: string; name: string }[];
  subject?: {
    id: string;
    name: string;
    color: string;
  };
}

function FolderCard({
  folder,
  selected,
  onToggleSelection,
  router,
  onRename,
  onDelete,
  isSubject = false
}: {
  folder: DriveFolder,
  selected: boolean,
  onToggleSelection: (id: string) => void,
  router: any,
  onRename: (folder: any) => void,
  onDelete: (id: string, name: string) => void,
  isSubject?: boolean
}) {
  return (
    <Card
      className={`cursor-pointer transition-colors hover:bg-accent ${selected ? 'ring-2 ring-primary' : ''} ${isSubject ? 'border-primary/20 bg-primary/5' : ''}`}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) {
          onToggleSelection(folder.id);
        } else {
          router.push(`/drive?folderId=${folder.id}`);
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {isSubject ? (
              <div
                className="h-8 w-8 rounded flex items-center justify-center shrink-0"
                style={{ backgroundColor: folder.subject?.color || '#3B82F6' }}
              >
                <BookOpen className="h-5 w-5 text-white" />
              </div>
            ) : (
              <Folder className="h-8 w-8 text-blue-500 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate" title={folder.name}>
                {isSubject ? folder.name.replace(/^Subjects - /, '') : folder.name}
              </p>
              <p className="text-xs text-muted-foreground whitespace-nowrap">
                {folder._count?.files || 0} files · {folder._count?.children || 0} folders
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
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onRename({ id: folder.id, name: folder.name });
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(folder.id, folder.name);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {folder.isPublic && (
          <Badge variant="secondary" className="mt-2 text-[10px] h-4">
            Public
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}

export default function DrivePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [renamingFolder, setRenamingFolder] = useState<{ id: string; name: string } | null>(null);
  const [newFolderName, setNewFolderName] = useState('');

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
  const { data: currentFolderData } = useQuery<{ folder: DriveFolder, breadcrumbs: { id: string, name: string }[] }>({
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

  const handleFolderRename = async (folderId: string, newName: string) => {
    try {
      const res = await fetch(`/api/drive/folders/${folderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (!res.ok) throw new Error('Failed to rename folder');

      toast({
        title: 'Success',
        description: 'Folder renamed successfully',
      });

      queryClient.invalidateQueries({ queryKey: ['drive-folders'] });
      setRenamingFolder(null);
      setNewFolderName('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleFolderDelete = async (folderId: string, folderName: string) => {
    if (!confirm(`Are you sure you want to delete "${folderName}"? This will move it to trash.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/drive/folders/${folderId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete folder');

      toast({
        title: 'Success',
        description: 'Folder moved to trash',
      });

      queryClient.invalidateQueries({ queryKey: ['drive-folders'] });
      queryClient.invalidateQueries({ queryKey: ['drive'] });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleFileDownload = async (fileId: string, fileName: string) => {
    try {
      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = `/api/drive/files/${fileId}`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Success',
        description: 'Download started',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to start download',
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
  const breadcrumbs = currentFolderData?.breadcrumbs || [];

  // Build breadcrumb path
  const breadcrumbPath = breadcrumbs;

  return (
    <div className="container mx-auto px-4 py-8">
      {drive && (
        <Card className="mb-6 bg-muted/20 border-dashed">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <CardTitle className="text-lg">My Drive</CardTitle>
                <span className="text-xs text-muted-foreground font-normal">
                  {drive.fileCount} files · {drive.folderCount} folders
                </span>
              </div>
              <div className="flex gap-1">
                <Link href="/drive/search">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Search">
                    <Search className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/drive/trash" className="text-muted-foreground">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Trash">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/drive/activity" className="text-primary">
                  <Button variant="ghost" size="icon" className="h-8 w-8" title="Activity">
                    <Activity className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  <span className="font-medium text-foreground">{formatBytes(Number(drive.storageUsed))}</span> of {formatBytes(Number(drive.storageLimit))} used
                </span>
                <span className="font-medium">{drive.storagePercentage.toFixed(1)}%</span>
              </div>
              <Progress value={drive.storagePercentage} className="h-1.5" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pt-2">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="hidden md:flex">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </Link>
          <div className="h-8 w-[1px] bg-border hidden md:block" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/drive">
                    <Home className="h-4 w-4" />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {breadcrumbPath.map((item, index) => (
                <div key={item.id} className="flex items-center">
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {index === breadcrumbPath.length - 1 ? (
                      <BreadcrumbPage className="max-w-[150px] truncate">{item.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={`/drive?folderId=${item.id}`} className="max-w-[150px] truncate">
                          {item.name}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex items-center gap-2">
          {selectedItems.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkDelete()}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedItems.length}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFolderDialogOpen(true)}
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          <Button variant="outline" size="sm" asChild>
            <label className="cursor-pointer">
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

      {/* Modern Folder Location Bar */}
      <div className="flex items-center gap-2 mb-6 px-3 py-2 bg-muted/40 rounded-lg border border-dashed text-sm text-muted-foreground overflow-x-auto no-scrollbar">
        <Folder className="h-4 w-4 shrink-0" />
        <span className="shrink-0">Location:</span>
        <div className="flex items-center gap-1 min-w-0">
          <Link href="/drive" className="hover:text-foreground hover:underline underline-offset-4 shrink-0">Root</Link>
          {breadcrumbPath.map((item, i) => (
            <div key={item.id} className="flex items-center gap-1 min-w-0">
              <span className="opacity-40">/</span>
              {i === breadcrumbPath.length - 1 ? (
                <span className="text-foreground font-medium truncate" title={item.name}>
                  {item.name}
                </span>
              ) : (
                <Link
                  href={`/drive?folderId=${item.id}`}
                  className="hover:text-foreground hover:underline underline-offset-4 truncate"
                  title={item.name}
                >
                  {item.name}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Folders and Subjects Section */}
      <div className="space-y-6 mb-8">
        {/* Subjects Section - only show at root */}
        {!folderId && folders.some(f => (f as any).folderType === 'subject') && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground px-1 uppercase tracking-wider">
              <BookOpen className="h-4 w-4" />
              Your Subjects
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {folders.filter(f => (f as any).folderType === 'subject').map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  selected={selectedItems.includes(folder.id)}
                  onToggleSelection={toggleItemSelection}
                  router={router}
                  onRename={(f) => {
                    setRenamingFolder(f);
                    setNewFolderName(f.name);
                  }}
                  onDelete={handleFolderDelete}
                  isSubject={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Regular Folders Section */}
        <div className="space-y-3">
          {(!folderId && folders.some(f => (f as any).folderType !== 'subject')) || (folderId && folders.length > 0) ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground px-1 uppercase tracking-wider">
              <Folder className="h-4 w-4" />
              Folders
            </div>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {foldersLoading && [...Array(2)].map((_, i) => <Skeleton key={i} className="h-32" />)}
            {folders.filter(f => folderId || (f as any).folderType !== 'subject').map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                selected={selectedItems.includes(folder.id)}
                onToggleSelection={toggleItemSelection}
                router={router}
                onRename={(f) => {
                  setRenamingFolder(f);
                  setNewFolderName(f.name);
                }}
                onDelete={handleFolderDelete}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">

        {filesLoading &&
          [...Array(8)].map((_, i) => <Skeleton key={i} className="h-32" />)}

        {files.length > 0 && files.map((file) => {
          const isImage = file.mimeType.startsWith('image/') || ['PNG', 'JPG', 'JPEG', 'GIF', 'WEBP'].includes(file.fileType);
          const isPDF = file.mimeType === 'application/pdf' || file.fileType === 'PDF';
          const hasThumbnail = isImage || isPDF;

          return (
            <Card
              key={file.id}
              className={`cursor-pointer transition-all hover:bg-accent/50 group overflow-hidden ${selectedItems.includes(file.id) ? 'ring-2 ring-primary' : ''
                }`}
              onClick={(e) => {
                if (e.ctrlKey || e.metaKey) {
                  toggleItemSelection(file.id);
                }
              }}
            >
              <CardContent className="p-0">
                {hasThumbnail && (
                  <div className="aspect-[16/10] w-full bg-muted overflow-hidden border-b relative">
                    <img
                      src={`/api/drive/files/${file.id}?thumbnail=true`}
                      alt={file.originalName}
                      className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                    {isPDF && (
                      <div className="absolute top-2 left-2">
                        <Badge variant="destructive" className="text-[10px] h-4 px-1 font-bold">PDF</Badge>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {!hasThumbnail && (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm" title={file.originalName}>
                          {file.originalName}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                          {file.fileType} • {formatBytes(Number(file.fileSize))}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleFileDownload(file.id, file.originalName)}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            // Implement file delete
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div >

      {/* Empty state */}
      {
        !filesLoading &&
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
        )
      }

      {/* Folder creation dialog */}
      <FolderCreateDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        parentId={folderId}
      />

      {/* Folder rename dialog */}
      {
        renamingFolder && (
          <Dialog open={!!renamingFolder} onOpenChange={() => setRenamingFolder(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Rename Folder</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter new folder name"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setRenamingFolder(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleFolderRename(renamingFolder.id, newFolderName)}
                  disabled={!newFolderName.trim()}
                >
                  Rename
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )
      }
    </div >
  );
}
