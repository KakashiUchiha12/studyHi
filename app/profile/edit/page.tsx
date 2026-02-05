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

    // Basic Info
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [image, setImage] = useState("");

    // Websites
    const [website, setWebsite] = useState("");
    const [websiteLabel, setWebsiteLabel] = useState("");
    const [websiteUrl2, setWebsiteUrl2] = useState("");
    const [websiteLabel2, setWebsiteLabel2] = useState("");

    // Social Media
    const [githubUrl, setGithubUrl] = useState("");
    const [linkedinUrl, setLinkedinUrl] = useState("");
    const [twitterUrl, setTwitterUrl] = useState("");
    const [instagramUrl, setInstagramUrl] = useState("");
    const [instagramLabel, setInstagramLabel] = useState("");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [youtubeLabel, setYoutubeLabel] = useState("");
    const [whatsappUrl, setWhatsappUrl] = useState("");
    const [whatsappLabel, setWhatsappLabel] = useState("");

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
                    setWebsite(data.socialProfile.website || "");
                    setWebsiteLabel(data.socialProfile.websiteLabel || "");
                    setWebsiteUrl2(data.socialProfile.websiteUrl2 || "");
                    setWebsiteLabel2(data.socialProfile.websiteLabel2 || "");
                    setGithubUrl(data.socialProfile.githubUrl || "");
                    setLinkedinUrl(data.socialProfile.linkedinUrl || "");
                    setTwitterUrl(data.socialProfile.twitterUrl || "");
                    setInstagramUrl(data.socialProfile.instagramUrl || "");
                    setInstagramLabel(data.socialProfile.instagramLabel || "");
                    setYoutubeUrl(data.socialProfile.youtubeUrl || "");
                    setYoutubeLabel(data.socialProfile.youtubeLabel || "");
                    setWhatsappUrl(data.socialProfile.whatsappUrl || "");
                    setWhatsappLabel(data.socialProfile.whatsappLabel || "");
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
                body: JSON.stringify({
                    name,
                    username,
                    bio,
                    image,
                    website,
                    websiteLabel,
                    websiteUrl2,
                    websiteLabel2,
                    githubUrl,
                    linkedinUrl,
                    twitterUrl,
                    instagramUrl,
                    instagramLabel,
                    youtubeUrl,
                    youtubeLabel,
                    whatsappUrl,
                    whatsappLabel
                })
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
                    <form onSubmit={onSubmit} className="space-y-8">
                        {/* Avatar Section */}
                        <div className="flex flex-col items-center gap-4 py-4 border-b">
                            <div className="relative w-24 h-24">
                                <img src={image || "/placeholder-user.jpg"} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-slate-50" />
                                <label htmlFor="file-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full cursor-pointer hover:bg-primary/90 shadow-lg transition">
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
                            <p className="text-xs text-muted-foreground font-medium">Click camera to change photo</p>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-900 border-l-4 border-primary pl-2 uppercase tracking-wider">Basic Information</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="username">Username</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                                        <Input id="username" value={username} onChange={(e) => setUsername(e.target.value.trim())} className="pl-8" placeholder="username" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Unique identifier for your profile url.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell us about yourself..." />
                                </div>
                            </div>
                        </div>

                        {/* Websites */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-900 border-l-4 border-primary pl-2 uppercase tracking-wider">Websites</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="website">Website 1 URL</Label>
                                    <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="websiteLabel">Website 1 Label</Label>
                                    <Input id="websiteLabel" value={websiteLabel} onChange={(e) => setWebsiteLabel(e.target.value)} placeholder="Portfolio" />
                                </div>
                                <div className="space-y-2 border-t pt-4 sm:border-t-0 sm:pt-0">
                                    <Label htmlFor="website2">Website 2 URL</Label>
                                    <Input id="website2" value={websiteUrl2} onChange={(e) => setWebsiteUrl2(e.target.value)} placeholder="https://..." />
                                </div>
                                <div className="space-y-2 sm:pt-0">
                                    <Label htmlFor="websiteLabel2">Website 2 Label</Label>
                                    <Input id="websiteLabel2" value={websiteLabel2} onChange={(e) => setWebsiteLabel2(e.target.value)} placeholder="Blog" />
                                </div>
                            </div>
                        </div>

                        {/* Social Media */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-slate-900 border-l-4 border-primary pl-2 uppercase tracking-wider">Social Media</h3>
                            <div className="grid grid-cols-1 gap-6">
                                {/* YouTube */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-lg border">
                                    <div className="space-y-2">
                                        <Label htmlFor="youtube">YouTube URL</Label>
                                        <Input id="youtube" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="youtubeLabel">YouTube Label</Label>
                                        <Input id="youtubeLabel" value={youtubeLabel} onChange={(e) => setYoutubeLabel(e.target.value)} placeholder="My Channel" />
                                    </div>
                                </div>

                                {/* Instagram */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-lg border">
                                    <div className="space-y-2">
                                        <Label htmlFor="instagram">Instagram URL</Label>
                                        <Input id="instagram" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="instagramLabel">Instagram Label</Label>
                                        <Input id="instagramLabel" value={instagramLabel} onChange={(e) => setInstagramLabel(e.target.value)} placeholder="Follow me" />
                                    </div>
                                </div>

                                {/* WhatsApp */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-lg border">
                                    <div className="space-y-2">
                                        <Label htmlFor="whatsapp">WhatsApp Link/Number</Label>
                                        <Input id="whatsapp" value={whatsappUrl} onChange={(e) => setWhatsappUrl(e.target.value)} placeholder="wa.me/..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="whatsappLabel">WhatsApp Label</Label>
                                        <Input id="whatsappLabel" value={whatsappLabel} onChange={(e) => setWhatsappLabel(e.target.value)} placeholder="Chat with me" />
                                    </div>
                                </div>

                                {/* Other Socials */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="github">GitHub URL</Label>
                                        <Input id="github" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} placeholder="https://github.com/..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="linkedin">LinkedIn URL</Label>
                                        <Input id="linkedin" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="twitter">Twitter URL</Label>
                                        <Input id="twitter" value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://twitter.com/..." />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t">
                            <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" disabled={saving} className="px-8">
                                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Save Profile
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
