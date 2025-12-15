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
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CreateCommunityPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        isPrivate: false
    });

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
                                This needs to be unique.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="What is this community about?"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                maxLength={300}
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
