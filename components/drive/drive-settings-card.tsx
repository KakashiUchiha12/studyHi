'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Lock, Unlock, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface DriveSettings {
    isPrivate: boolean;
    allowCopying: 'ALLOW' | 'REQUEST' | 'DENY';
}

export function DriveSettingsCard() {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch drive settings
    const { data: driveData, isLoading } = useQuery<{ drive: DriveSettings }>({
        queryKey: ['drive-settings'],
        queryFn: async () => {
            const res = await fetch('/api/drive');
            if (!res.ok) throw new Error('Failed to fetch drive settings');
            return res.json();
        },
    });

    // Update settings mutation
    const updateMutation = useMutation({
        mutationFn: async (settings: Partial<DriveSettings>) => {
            const res = await fetch('/api/drive', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to update settings');
            }
            return res.json();
        },
        onSuccess: () => {
            toast({
                title: 'Success',
                description: 'Drive settings updated',
            });
            queryClient.invalidateQueries({ queryKey: ['drive-settings'] });
            queryClient.invalidateQueries({ queryKey: ['drive'] });
        },
        onError: (error: Error) => {
            toast({
                title: 'Error',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Drive Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const settings = driveData?.drive;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Drive Settings
                </CardTitle>
                <CardDescription>
                    Control who can see and copy your files
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Privacy Toggle */}
                <div className="flex items-center justify-between space-x-2">
                    <div className="flex-1">
                        <Label htmlFor="privacy" className="flex items-center gap-2">
                            {settings?.isPrivate ? (
                                <Lock className="h-4 w-4 text-red-500" />
                            ) : (
                                <Unlock className="h-4 w-4 text-green-500" />
                            )}
                            <span>Private Drive</span>
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                            {settings?.isPrivate
                                ? 'Your drive is private. Only you can see your files.'
                                : 'Your drive is public. Others can see your public files.'}
                        </p>
                    </div>
                    <Switch
                        id="privacy"
                        checked={settings?.isPrivate || false}
                        onCheckedChange={(checked) => {
                            updateMutation.mutate({ isPrivate: checked });
                        }}
                        disabled={updateMutation.isPending}
                    />
                </div>

                {/* Copy Permission */}
                <div className="space-y-2">
                    <Label htmlFor="copy-permission" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Copy Permission</span>
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        Control how others can copy your files
                    </p>
                    <Select
                        value={settings?.allowCopying || 'REQUEST'}
                        onValueChange={(value: 'ALLOW' | 'REQUEST' | 'DENY') => {
                            updateMutation.mutate({ allowCopying: value });
                        }}
                        disabled={updateMutation.isPending}
                    >
                        <SelectTrigger id="copy-permission">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALLOW">
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">Allow All</span>
                                    <span className="text-xs text-muted-foreground">
                                        Anyone can copy without asking
                                    </span>
                                </div>
                            </SelectItem>
                            <SelectItem value="REQUEST">
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">Request Approval</span>
                                    <span className="text-xs text-muted-foreground">
                                        Users must request permission
                                    </span>
                                </div>
                            </SelectItem>
                            <SelectItem value="DENY">
                                <div className="flex flex-col items-start">
                                    <span className="font-medium">Deny All</span>
                                    <span className="text-xs text-muted-foreground">
                                        No one can copy your files
                                    </span>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {updateMutation.isPending && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating settings...</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
