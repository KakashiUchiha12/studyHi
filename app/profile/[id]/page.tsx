"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, FileText } from "lucide-react";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function UserProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [following, setFollowing] = useState(false);
    const [loadingFollow, setLoadingFollow] = useState(false);

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
        <div className="container max-w-4xl py-10">
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Profile Info Side */}
                <Card className="w-full md:w-1/3">
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
                            <div className="text-center">
                                <div className="font-bold text-lg">{profile._count.followers}</div>
                                <div className="text-xs text-muted-foreground uppercase">Followers</div>
                            </div>
                            <div className="text-center">
                                <div className="font-bold text-lg">{profile._count.following}</div>
                                <div className="text-xs text-muted-foreground uppercase">Following</div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 w-full">
                            {isMe ? (
                                <Button onClick={() => router.push("/profile/edit")} variant="outline" className="w-full">
                                    Edit Profile
                                </Button>
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

                {/* Content Side */}
                <div className="w-full md:w-2/3 space-y-6">
                    <div className="bg-slate-50 rounded-lg p-8 text-center border text-muted-foreground border-dashed">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>No posts yet.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
