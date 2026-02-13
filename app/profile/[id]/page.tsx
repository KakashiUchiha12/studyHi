"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link"; // Added Link import
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { ProfilePostGrid } from "@/components/profile/profile-post-grid";
import { ProfileSubjects } from "@/components/profile/profile-subjects";
import { ProfileDocuments } from "@/components/profile/profile-documents";
import { ProfileProjects } from "@/components/profile/profile-projects";
import { ProfileSocialLinks } from "@/components/profile/profile-social-links";
import { cn } from "@/lib/utils";

import { UserListDialog } from "@/components/profile/user-list-dialog";

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState(false);
    const [loadingFollow, setLoadingFollow] = useState(false);

    // Dialog States
    const [followersOpen, setFollowersOpen] = useState(false);
    const [followingOpen, setFollowingOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("published");

    useEffect(() => {
        if (params.id) {
            fetchProfile(params.id as string);
        }
    }, [params.id]);

    const fetchProfile = async (id: string) => {
        try {
            const res = await fetch(`/api/users/${id}`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                setFollowing(data.isFollowing);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleFollow = async () => {
        if (!session) {
            router.push("/api/auth/signin");
            return;
        }
        setLoadingFollow(true);
        try {
            const method = following ? "DELETE" : "POST";
            const res = await fetch(`/api/users/${params.id}/follow`, { method });
            if (res.ok) {
                setFollowing(!following);
                // Ideally refresh follower count too
                setProfile((prev: any) => ({
                    ...prev,
                    _count: {
                        ...prev._count,
                        followers: following ? prev._count.followers - 1 : prev._count.followers + 1
                    }
                }));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingFollow(false);
        }
    };

    if (loading) return <div className="p-8 text-center"><Loader2 className="animate-spin inline-block" /></div>;
    if (!profile) return <div className="p-8 text-center">User not found</div>;

    const isMe = session?.user && (session.user as any).id === profile.id;

    return (
        <div className="container max-w-6xl py-6 px-0 sm:px-4 md:py-10">
            <div className="flex flex-col md:flex-row gap-4 sm:gap-8 items-start">
                <div className="w-full md:w-1/3 space-y-4">
                    <Card className="rounded-none sm:rounded-xl border-x-0 sm:border-x">
                        <CardContent className="pt-6 flex flex-col items-center text-center">
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 mb-4">
                                <img src={profile.image || "/placeholder-user.jpg"} alt={profile.name} className="w-full h-full object-cover" />
                            </div>
                            <h1 className="text-2xl font-bold mb-1">{profile.name}</h1>
                            <p className="text-muted-foreground text-sm mb-4">@{profile.id.slice(0, 8)}</p>

                            {profile.socialProfile?.bio && (
                                <p className="text-sm text-foreground mb-6 px-4">{profile.socialProfile.bio}</p>
                            )}

                            <div className="flex gap-6 w-full justify-center mb-6 py-4 border-y border-slate-100">
                                <div className="text-center">
                                    <div className="font-bold text-lg">{profile._count.posts}</div>
                                    <div className="text-xs text-muted-foreground uppercase">Posts</div>
                                </div>
                                <div className="text-center cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors" onClick={() => setFollowersOpen(true)}>
                                    <div className="font-bold text-lg">{profile._count.followers}</div>
                                    <div className="text-xs text-muted-foreground uppercase">Followers</div>
                                </div>
                                <div className="text-center cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors" onClick={() => setFollowingOpen(true)}>
                                    <div className="font-bold text-lg">{profile._count.following}</div>
                                    <div className="text-xs text-muted-foreground uppercase">Following</div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 w-full">
                                {isMe ? (
                                    <div className="flex justify-center gap-2 mt-6 pt-6 border-t w-full">
                                        <Button variant="outline" className="flex-1" asChild>
                                            <Link href="/profile/edit">Edit Profile</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Button onClick={() => router.push(`/messages/${profile.id}`)} variant="outline" className="w-full">
                                            Message
                                        </Button>
                                        <Button
                                            onClick={toggleFollow}
                                            disabled={loadingFollow}
                                            variant={following ? "secondary" : "default"}
                                            className="w-full"
                                        >
                                            {following ? "Unfollow" : "Follow"}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <ProfileSocialLinks socialProfile={profile.socialProfile} /> {/* Added component */}
                </div>

                {/* Content Side */}
                <div className="w-full md:w-2/3 space-y-6">
                    {/* Subjects Section */}
                    <ProfileSubjects userId={profile.id} isOwnProfile={!!isMe} />

                    {/* Public Documents Section */}
                    <ProfileDocuments userId={profile.id} isOwnProfile={!!isMe} />

                    {/* Projects Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Projects</h2>
                        </div>
                        <ProfileProjects userId={profile.id} />
                    </div>

                    {/* Posts Grid */}
                    <div className="px-4 sm:px-0 space-y-4">
                        {isMe && (
                            <div className="flex border-b">
                                <Button
                                    variant="ghost"
                                    className={cn("rounded-none border-b-2 px-6", activeTab === "published" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
                                    onClick={() => setActiveTab("published")}
                                >
                                    Posts
                                </Button>
                                <Button
                                    variant="ghost"
                                    className={cn("rounded-none border-b-2 px-6", activeTab === "archived" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
                                    onClick={() => setActiveTab("archived")}
                                >
                                    Archived
                                </Button>
                                <Button
                                    variant="ghost"
                                    className={cn("rounded-none border-b-2 px-6", activeTab === "draft" ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
                                    onClick={() => setActiveTab("draft")}
                                >
                                    Drafts
                                </Button>
                            </div>
                        )}

                        <ProfilePostGrid
                            userId={profile.id}
                            currentUserId={(session?.user as any)?.id}
                            status={activeTab}
                        />
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <UserListDialog
                open={followersOpen}
                onOpenChange={setFollowersOpen}
                userId={profile.id}
                type="followers"
            />
            <UserListDialog
                open={followingOpen}
                onOpenChange={setFollowingOpen}
                userId={profile.id}
                type="following"
            />
        </div>
    );
}
