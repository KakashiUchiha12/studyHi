"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageCropper } from "@/components/profile/image-cropper";
import { Loader2, Camera } from "lucide-react";

export default function ProfileEditPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [image, setImage] = useState("");

    // Cropper State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [previewSrc, setPreviewSrc] = useState<string | null>(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/profile");
            if (res.ok) {
                const data = await res.json();
                setName(data.name || "");
                setUsername(data.username || "");
                setImage(data.image || "");
                if (data.socialProfile) {
                    setBio(data.socialProfile.bio || "");
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.addEventListener("load", () => setPreviewSrc(reader.result?.toString() || ""));
            reader.readAsDataURL(file);
            setCropperOpen(true);
        }
    };

    const onCropComplete = async (croppedBlob: Blob) => {
        const file = new File([croppedBlob], "profile.jpg", { type: "image/jpeg" });

        setSaving(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setImage(data.url);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
            setCropperOpen(false);
        }
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, username, bio, image })
            });

            if (res.ok) {
                router.refresh();
                router.push("/profile/" + (await res.json()).id);
            } else {
                const err = await res.text();
                alert("Failed to update: " + err);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="container max-w-2xl py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                    <CardDescription>Customize how you look to others.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onSubmit} className="space-y-6">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative w-24 h-24">
                                <img src={image || "/placeholder-user.jpg"} alt="Profile" className="w-24 h-24 rounded-full object-cover border" />
                                <label htmlFor="file-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1 rounded-full cursor-pointer hover:bg-primary/90 transition">
                                    <Camera className="w-4 h-4" />
                                </label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={onFileSelect}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Click camera to change photo</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Display Name</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value.trim())} className="pl-8" />
                            </div>
                            <p className="text-xs text-muted-foreground">Unique identifier for your profile url.</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell us about yourself..." />
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <ImageCropper
                open={cropperOpen}
                setOpen={setCropperOpen}
                imageSrc={previewSrc}
                onCropComplete={onCropComplete}
            />
        </div>
    );
}
