"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, ThumbsUp, Pin, Paperclip, Send } from "lucide-react";

interface Post {
  id: string;
  type: string;
  title?: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  _count: {
    comments: number;
    likes: number;
  };
  likes: Array<{ id: string }>;
}

export default function StreamTab({ classId, userRole }: { classId: string; userRole: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState({ type: "general", content: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [classId]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}/posts`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.content.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/classes/${classId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost),
      });

      if (response.ok) {
        setNewPost({ type: "general", content: "" });
        fetchPosts();
      }
    } catch (error) {
      console.error("Failed to create post:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      await fetch(`/api/classes/${classId}/posts/${postId}/like`, {
        method: "POST",
      });
      fetchPosts();
    } catch (error) {
      console.error("Failed to like post:", error);
    }
  };

  const handlePinPost = async (postId: string) => {
    try {
      await fetch(`/api/classes/${classId}/posts/${postId}/pin`, {
        method: "POST",
      });
      fetchPosts();
    } catch (error) {
      console.error("Failed to pin post:", error);
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "announcement":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "material":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "question":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Post Card */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="flex gap-3">
              <Select
                value={newPost.type}
                onValueChange={(value) => setNewPost({ ...newPost, type: value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="material">Material</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Textarea
              placeholder="Share something with your class..."
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              rows={3}
            />

            <div className="flex justify-between">
              <Button type="button" variant="outline" size="sm">
                <Paperclip className="w-4 h-4 mr-2" />
                Attach
              </Button>
              <Button type="submit" disabled={submitting}>
                <Send className="w-4 h-4 mr-2" />
                Post
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Posts List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No posts yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className={post.isPinned ? "border-blue-500 border-2" : ""}>
              <CardContent className="pt-6">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      {post.user.image ? (
                        <img
                          src={post.user.image}
                          alt={post.user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {post.user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {post.user.name}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${getPostTypeColor(post.type)}`}
                        >
                          {post.type}
                        </span>
                        {post.isPinned && (
                          <Pin className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {(userRole === "admin" || userRole === "teacher") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePinPost(post.id)}
                    >
                      <Pin className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Post Content */}
                <div className="mb-4">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {post.content}
                  </p>
                </div>

                {/* Post Actions */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLikePost(post.id)}
                    className={post.likes.length > 0 ? "text-blue-500" : ""}
                  >
                    <ThumbsUp className="w-4 h-4 mr-1" />
                    {post._count.likes}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    {post._count.comments}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
