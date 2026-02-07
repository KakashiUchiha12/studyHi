"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { ImageCropper } from "@/components/ui/image-cropper";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Progress } from "@/components/ui/progress";

export default function CreateCommunityPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        isPrivate: false,
        showInSearch: true,
        coverImage: "",
        icon: "",
        rules: ""
    });

    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [activeCropType, setActiveCropType] = useState<"cover" | "icon">("cover");
    const [cropperOpen, setCropperOpen] = useState(false);

    // Independent progress for cover and icon
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleImageUpload = async (file: File) => {
        setUploadProgress(10);
        const formData = new FormData();
        formData.append("file", file);

        try {
            // Simulate progress
            const interval = setInterval(() => {
                setUploadProgress((prev) => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 100);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            clearInterval(interval);
            setUploadProgress(100);

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();
            return data.url;
        } catch (error) {
            console.error(error);
            setUploadProgress(0);
            throw error;
        }
    };

    const onFileSelect = (type: "cover" | "icon") => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setActiveCropType(type);
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setImageSrc(reader.result?.toString() || null);
                setCropperOpen(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const handleCropComplete = async (croppedBlob: Blob) => {
        try {
            setCropperOpen(false);
            const file = new File([croppedBlob], activeCropType === "cover" ? "cover.jpg" : "icon.jpg", { type: "image/jpeg" });

            if (activeCropType === "cover") {
                console.log("Starting cover upload...");
                const url = await handleImageUpload(file);
                console.log("Cover upload result:", url);
                if (url) {
                    setFormData(prev => ({ ...prev, coverImage: url }));
                    toast.success("Cover image uploaded!");
                }
            } else {
                console.log("Starting icon upload...");
                const url = await handleImageUpload(file);
                console.log("Icon upload result:", url);
                if (url) {
                    setFormData(prev => ({ ...prev, icon: url }));
                    toast.success("Icon uploaded!");
                }
            }
            // Reset progress after a delay
            setTimeout(() => setUploadProgress(0), 1000);
        } catch (error) {
            console.error("Upload error details:", error);
            toast.error("Upload failed: " + (error as any).message);
            setUploadProgress(0);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return;

        setLoading(true);
        try {
            const res = await fetch("/api/communities", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                if (res.status === 409) {
                    toast.error("Community name already exists");
                } else {
                    toast.error("Failed to create community");
                }
                return;
            }

            const community = await res.json();
            toast.success("Community created successfully!");
            router.push(`/community/${community.id}`);
        } catch (error) {
            console.error(error);
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-white shadow-lg">
                <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/community" className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <span className="text-sm font-medium text-muted-foreground">Back to communities</span>
                    </div>
                    <CardTitle className="text-2xl">Create a Community</CardTitle>
                    <CardDescription>
                        Start a new study group or topic channel for people to join.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Community Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Physics Enthusiasts"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                maxLength={50}
                            />
                            <p className="text-xs text-muted-foreground">
                                A unique ID will be generated automatically.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="grid grid-cols-[120px_1fr] gap-6">
                                <div className="space-y-2">
                                    <Label>Icon</Label>
                                    <div className="border-2 border-dashed rounded-full h-32 w-32 flex items-center justify-center relative bg-gray-50 overflow-hidden group">
                                        {formData.icon ? (
                                            <>
                                                <img src={formData.icon} alt="Icon" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button type="button" variant="destructive" size="icon" className="w-8 h-8 rounded-full" onClick={() => setFormData({ ...formData, icon: "" })}>
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:bg-gray-100 transition-colors"
                                                onClick={() => document.getElementById('icon-upload')?.click()}>
                                                {uploadProgress > 0 && activeCropType === "icon" ? (
                                                    <div className="space-y-1 w-20 text-center">
                                                        <Progress value={uploadProgress} className="h-1.5" />
                                                        <p className="text-[10px]">Uploading...</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Upload className="w-6 h-6 mb-1" />
                                                        <span className="text-[10px] text-center px-1">Upload</span>
                                                    </>
                                                )}
                                                <Input id="icon-upload" type="file" accept="image/*" className="hidden" onChange={onFileSelect("icon")} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Cover Image</Label>
                                    <div className="border-2 border-dashed rounded-lg h-32 flex flex-col items-center justify-center text-center relative bg-gray-50 overflow-hidden">
                                        {formData.coverImage ? (
                                            <div className="relative w-full h-full group">
                                                <img src={formData.coverImage} alt="Cover" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button type="button" variant="destructive" size="sm" onClick={() => setFormData({ ...formData, coverImage: "" })}>
                                                        <X className="w-4 h-4 mr-2" /> Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
                                                onClick={() => document.getElementById('cover-upload')?.click()}>
                                                {uploadProgress > 0 && activeCropType === "cover" ? (
                                                    <div className="space-y-2 w-1/2">
                                                        <Progress value={uploadProgress} className="h-2" />
                                                        <p className="text-xs">Uploading...</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                            <Upload className="h-5 w-5" />
                                                        </div>
                                                        <div className="text-sm">Click to upload banner</div>
                                                        <p className="text-xs text-muted-foreground">4:1 recommended (Panoramic)</p>
                                                    </>
                                                )}
                                                <Input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={onFileSelect("cover")} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <ImageCropper
                                imageSrc={imageSrc}
                                open={cropperOpen}
                                onOpenChange={(open) => {
                                    setCropperOpen(open);
                                    if (!open) {
                                        // Reset inputs
                                        const coverInput = document.getElementById('cover-upload') as HTMLInputElement;
                                        const iconInput = document.getElementById('icon-upload') as HTMLInputElement;
                                        if (coverInput) coverInput.value = '';
                                        if (iconInput) iconInput.value = '';
                                    }
                                }}
                                onCropComplete={handleCropComplete}
                                aspectRatio={activeCropType === "cover" ? 4 / 1 : 1}
                            />
                        </div>

                        <div className="space-y-4">
                            <Label>Description</Label>
                            <div className="min-h-[200px]">
                                <RichTextEditor
                                    value={formData.description}
                                    onChange={(html) => setFormData({ ...formData, description: html })}
                                    placeholder="Tell people what this community is about..."
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between border rounded-lg p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Discovery Visibility</Label>
                                <p className="text-sm text-muted-foreground">
                                    Show this community in search results.
                                </p>
                            </div>
                            <Switch
                                checked={formData.showInSearch}
                                onCheckedChange={(checked) => setFormData({ ...formData, showInSearch: checked })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Community Rules</Label>
                            <RichTextEditor
                                value={formData.rules}
                                onChange={(html) => setFormData({ ...formData, rules: html })}
                                placeholder="- Be respectful&#10;- No spam&#10;- Stay on topic"
                                className="min-h-[150px]"
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base">Private Community</Label>
                                <div className="text-sm text-muted-foreground">
                                    Only invited members can join and view content.
                                </div>
                            </div>
                            <Switch
                                checked={formData.isPrivate}
                                onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => router.back()}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary/90"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Community
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
