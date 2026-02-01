"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Loader2, Plus, Upload, X } from "lucide-react";
// import { UploadDropzone } from "@/lib/uploadthing";
import { toast } from "sonner";

interface CreateEventDialogProps {
    communityId: string;
    onEventCreated: () => void;
}

export function CreateEventDialog({ communityId, onEventCreated }: CreateEventDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        location: "",
        coverImage: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/communities/${communityId}/events`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success("Event created successfully!");
                setOpen(false);
                onEventCreated();
                setFormData({
                    title: "", description: "", startDate: "", endDate: "", location: "", coverImage: ""
                });
            } else {
                toast.error("Failed to create event");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" /> Create Event
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Event Cover</Label>
                        {formData.coverImage ? (
                            <div className="relative h-32 rounded-md overflow-hidden group">
                                <img src={formData.coverImage} alt="Preview" className="w-full h-full object-cover" />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => setFormData({ ...formData, coverImage: "" })}
                                >
                                    Remove
                                </Button>
                            </div>
                        ) : (
                            <div className="border border-dashed rounded-md p-4 flex flex-col items-center justify-center text-center space-y-2">
                                <div className="p-4 bg-muted rounded-full">
                                    <Upload className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Upload cover image</p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                                </div>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    id="cover-upload"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;

                                        const formData = new FormData();
                                        formData.append("file", file);

                                        try {
                                            const res = await fetch("/api/upload", {
                                                method: "POST",
                                                body: formData
                                            });

                                            if (res.ok) {
                                                const data = await res.json();
                                                setFormData({ ...formData, coverImage: data.url });
                                                toast.success("Cover image uploaded");
                                            } else {
                                                toast.error("Upload failed");
                                            }
                                        } catch (error) {
                                            console.error(error);
                                            toast.error("Upload error");
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => document.getElementById("cover-upload")?.click()}
                                >
                                    Select Image
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Event Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="datetime-local"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="datetime-local"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location">Location (Optional)</Label>
                        <Input
                            id="location"
                            placeholder="e.g. Library Room 304 or Zoom Link"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="min-h-[100px]"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Event
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
