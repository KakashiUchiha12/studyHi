"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, X, Save, Undo } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ImageCropper } from "@/components/ui/image-cropper";
import { Progress } from "@/components/ui/progress";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const formSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name must be less than 50 characters"),
    description: z.string().max(5000, "Description must be less than 500 characters").optional(), // Increased for Rich Text
    isPrivate: z.boolean().default(false),
    showInSearch: z.boolean().default(true),
    rules: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function CommunitySettingsPage() {
    const params = useParams();
    const { data: session } = useSession();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Custom state for images and rich text
    const [icon, setIcon] = useState<string | null>(null);
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const [description, setDescription] = useState(""); // Rich Text State
    const [rules, setRules] = useState(""); // Rich Text State

    // Upload Interaction State
    const [iconCropperOpen, setIconCropperOpen] = useState(false);
    const [coverCropperOpen, setCoverCropperOpen] = useState(false);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            isPrivate: false,
            showInSearch: true,
        }
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/communities/${params.id}`);
                if (!res.ok) throw new Error("Failed to fetch community");

                const data = await res.json();

                // Permission Check (Client-side optimization, API also checks)
                const currentMember = data.members?.find((m: any) => m.userId === (session?.user as any)?.id);
                if (!currentMember || currentMember.role !== 'admin') {
                    router.push(`/community/${params.id}`);
                    return;
                }

                setValue("name", data.name);
                setValue("isPrivate", data.isPrivate);
                setValue("showInSearch", data.showInSearch);
                setDescription(data.description || "");
                setRules(data.rules || "");
                setIcon(data.icon);
                setCoverImage(data.coverImage);
                setLoading(false);
            } catch (error) {
                console.error(error);
                router.push("/community");
            }
        };

        if (session?.user && params?.id) {
            fetchData();
        }
    }, [params?.id, session, setValue, router]);

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'icon' | 'cover') => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = () => {
                setSelectedImageSrc(reader.result as string);
                if (type === 'icon') setIconCropperOpen(true);
                else setCoverCropperOpen(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob, type: 'icon' | 'cover') => {
        const file = new File([croppedBlob], type === 'icon' ? "icon.jpg" : "cover.jpg", { type: "image/jpeg" });

        try {
            setUploadProgress(10);
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            setUploadProgress(80);

            if (res.ok) {
                const data = await res.json();
                if (type === 'icon') setIcon(data.url);
                else setCoverImage(data.url);
            }
            setUploadProgress(100);
            setTimeout(() => setUploadProgress(0), 1000);
        } catch (e) {
            console.error(e);
            toast({
                title: "Upload failed",
                description: "Please try again.",
                variant: "destructive"
            });
        } finally {
            if (type === 'icon') setIconCropperOpen(false);
            else setCoverCropperOpen(false);
        }
    };

    const onSubmit = async (data: FormData) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/communities/${params.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...data,
                    description,
                    rules,
                    icon,
                    coverImage
                })
            });

            if (!res.ok) throw new Error("Failed to update");

            toast({
                title: "Settings saved",
                description: "Your community has been updated.",
            });
            router.refresh();
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong. Please try again.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Community Settings</h1>
                    <p className="text-muted-foreground">Manage your community profile and preferences.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                        <Undo className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={saving} className="bg-primary">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Customize how your community looks to others.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Icon Upload */}
                    <div className="flex flex-col gap-3">
                        <Label>Community Icon</Label>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-xl bg-slate-100 border flex items-center justify-center overflow-hidden shrink-0 relative">
                                {icon ? (
                                    <img src={icon} alt="Icon" className="w-full h-full object-cover" />
                                ) : (
                                    <Users className="w-8 h-8 text-muted-foreground" />
                                )}
                                {uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <Button variant="outline" size="sm" className="relative cursor-pointer">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept="image/*"
                                        onChange={(e) => onFileSelect(e, 'icon')}
                                    />
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Icon
                                </Button>
                                <p className="text-xs text-muted-foreground">Recommended 1:1 ratio (Square).</p>
                            </div>
                        </div>
                    </div>

                    {/* Cover Upload */}
                    <div className="flex flex-col gap-3">
                        <Label>Cover Image</Label>
                        <div className="relative w-full aspect-video rounded-xl bg-slate-100 border overflow-hidden group">
                            {coverImage ? (
                                <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-muted-foreground">No cover image</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button variant="secondary" className="relative cursor-pointer">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        accept="image/*"
                                        onChange={(e) => onFileSelect(e, 'cover')}
                                    />
                                    <Upload className="w-4 h-4 mr-2" />
                                    Change Cover
                                </Button>
                            </div>
                            {uploadProgress > 0 && <Progress value={uploadProgress} className="absolute bottom-0 left-0 right-0 h-1 rounded-none" />}
                        </div>
                        <p className="text-xs text-muted-foreground">Recommended 16:9 ratio.</p>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="w-full justify-start">
                    <TabsTrigger value="general">General Details</TabsTrigger>
                    <TabsTrigger value="privacy">Privacy & Access</TabsTrigger>
                </TabsList>

                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Community Name</Label>
                                <Input id="name" {...register("name")} placeholder="e.g. Computer Science Fundamentals" />
                                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label>Description</Label>
                                <RichTextEditor value={description} onChange={setDescription} />
                                <p className="text-xs text-muted-foreground">
                                    Describe your community, its purpose, and what members can expect.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>Community Rules</Label>
                                <RichTextEditor value={rules} onChange={setRules} />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="privacy">
                    <Card>
                        <CardHeader>
                            <CardTitle>Privacy Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between space-x-2">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Private Community</Label>
                                    <Label className="text-xs text-muted-foreground block font-normal">
                                        Only approved members can see posts and join.
                                    </Label>
                                </div>
                                <Switch
                                    checked={watch("isPrivate")}
                                    onCheckedChange={(checked) => setValue("isPrivate", checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between space-x-2">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Show in Search</Label>
                                    <Label className="text-xs text-muted-foreground block font-normal">
                                        Allow this community to be found in the Explore page.
                                    </Label>
                                </div>
                                <Switch
                                    checked={watch("showInSearch")}
                                    onCheckedChange={(checked) => setValue("showInSearch", checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Danger Zone */}
            <Card className="border-red-200 bg-red-50/50">
                <CardHeader>
                    <CardTitle className="text-red-700">Danger Zone</CardTitle>
                    <CardDescription className="text-red-600/80">Irreversible actions for your community.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold text-red-900">Delete Community</h4>
                            <p className="text-sm text-red-700/70">Permanently remove this community and all its content.</p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">Delete Community</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the community
                                        <span className="font-semibold ml-1">"{watch("name")}"</span> and remove all member data.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={async () => {
                                            try {
                                                const res = await fetch(`/api/communities/${params.id}`, { method: "DELETE" });
                                                if (!res.ok) throw new Error("Failed to delete");
                                                router.push("/community");
                                                toast({ title: "Community deleted" });
                                            } catch (e) {
                                                toast({ title: "Error", description: "Could not delete community", variant: "destructive" });
                                            }
                                        }}
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>

            {/* Image Croppers */}
            {selectedImageSrc && (
                <>
                    <ImageCropper
                        open={iconCropperOpen}
                        onOpenChange={setIconCropperOpen}
                        imageSrc={selectedImageSrc}
                        onCropComplete={(blob) => handleCropComplete(blob, 'icon')}
                        aspectRatio={1}
                    />
                    <ImageCropper
                        open={coverCropperOpen}
                        onOpenChange={setCoverCropperOpen}
                        imageSrc={selectedImageSrc}
                        onCropComplete={(blob) => handleCropComplete(blob, 'cover')}
                        aspectRatio={4 / 1}
                    />
                </>
            )}
        </div>
    );
}

function Users({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
