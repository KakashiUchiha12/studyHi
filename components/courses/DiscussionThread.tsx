"use client";

import { memo, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Reply, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ThreadMessage {
  id: string;
  question: string;
  answer?: string;
  isInstructor: boolean;
  userId: string;
  createdAt: string;
  user: {
    name: string;
    image?: string;
  };
  replies?: ThreadMessage[];
  parentId?: string;
}

interface DiscussionThreadProps {
  chapterId: string;
  messages: ThreadMessage[];
  currentUserId?: string;
  isInstructor?: boolean;
  onMessagePosted: () => void;
}

const DiscussionThread = memo(({ chapterId, messages, currentUserId, isInstructor = false, onMessagePosted }: DiscussionThreadProps) => {
  const [newMessageText, setNewMessageText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [postingState, setPostingState] = useState(false);
  const { toast } = useToast();

  const buildMessageHierarchy = useCallback((flatMessages: ThreadMessage[]) => {
    const messageMap = new Map<string, ThreadMessage>();
    const rootMessages: ThreadMessage[] = [];

    flatMessages.forEach(msg => {
      messageMap.set(msg.id, { ...msg, replies: [] });
    });

    flatMessages.forEach(msg => {
      const mappedMsg = messageMap.get(msg.id);
      if (!mappedMsg) return;

      if (msg.parentId) {
        const parentMsg = messageMap.get(msg.parentId);
        if (parentMsg) {
          parentMsg.replies = parentMsg.replies || [];
          parentMsg.replies.push(mappedMsg);
        }
      } else {
        rootMessages.push(mappedMsg);
      }
    });

    return rootMessages.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, []);

  const threadHierarchy = buildMessageHierarchy(messages);

  const publishNewMessage = useCallback(async () => {
    if (newMessageText.trim().length < 5) {
      toast({ title: "Message too short", description: "Please write at least 5 characters", variant: "destructive" });
      return;
    }

    setPostingState(true);
    try {
      const response = await fetch(`/api/courses/chapters/${chapterId}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newMessageText.trim() })
      });

      if (!response.ok) throw new Error("Failed to post message");

      setNewMessageText("");
      toast({ title: "Posted!", description: "Your question has been added" });
      onMessagePosted();
    } catch (error) {
      toast({ title: "Error", description: "Could not post message", variant: "destructive" });
    } finally {
      setPostingState(false);
    }
  }, [newMessageText, chapterId, toast, onMessagePosted]);

  const publishReply = useCallback(async (parentMessageId: string) => {
    if (replyContent.trim().length < 3) {
      toast({ title: "Reply too short", variant: "destructive" });
      return;
    }

    setPostingState(true);
    try {
      const response = await fetch(`/api/courses/chapters/${chapterId}/discussions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: replyContent.trim(),
          parentId: parentMessageId,
          answer: isInstructor ? replyContent.trim() : undefined
        })
      });

      if (!response.ok) throw new Error("Failed to post reply");

      setReplyContent("");
      setReplyingTo(null);
      toast({ title: "Reply posted!" });
      onMessagePosted();
    } catch (error) {
      toast({ title: "Error", description: "Could not post reply", variant: "destructive" });
    } finally {
      setPostingState(false);
    }
  }, [replyContent, chapterId, isInstructor, toast, onMessagePosted]);

  const MessageNode = ({ msg, depth = 0 }: { msg: ThreadMessage; depth?: number }) => {
    const timeString = formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true });
    const userInitials = msg.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const isReplyActive = replyingTo === msg.id;
    const isOwnMessage = msg.userId === currentUserId;

    return (
      <div className={cn("space-y-3", depth > 0 && "ml-8 md:ml-12 mt-3 pt-3 border-l-2 border-muted pl-4")}>
        <div className="flex gap-3">
          <Avatar className="w-9 h-9 shrink-0">
            <AvatarImage src={msg.user.image} />
            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-cyan-500 text-white text-xs font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm">{msg.user.name}</span>
              {msg.isInstructor && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Instructor
                </Badge>
              )}
              {isOwnMessage && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  You
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">{timeString}</span>
            </div>

            <p className="text-sm leading-relaxed mb-2">{msg.question}</p>

            {msg.answer && (
              <Card className="p-3 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 mt-2">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">Answer:</p>
                <p className="text-sm text-blue-800 dark:text-blue-200">{msg.answer}</p>
              </Card>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(isReplyActive ? null : msg.id)}
              className="h-7 text-xs mt-2 px-2"
            >
              <Reply className="w-3 h-3 mr-1" />
              Reply
            </Button>

            {isReplyActive && (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  className="min-h-[80px] text-sm"
                  disabled={postingState}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => publishReply(msg.id)}
                    disabled={postingState || replyContent.trim().length < 3}
                  >
                    {postingState ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                    Post Reply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyContent("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {msg.replies && msg.replies.length > 0 && (
          <div className="space-y-3">
            {msg.replies.map(reply => (
              <MessageNode key={reply.id} msg={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Discussion
        </h3>

        <div className="space-y-3">
          <Textarea
            value={newMessageText}
            onChange={(e) => setNewMessageText(e.target.value)}
            placeholder="Ask a question or start a discussion..."
            className="min-h-[100px]"
            disabled={postingState}
          />
          <Button
            onClick={publishNewMessage}
            disabled={postingState || newMessageText.trim().length < 5}
          >
            {postingState ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Post Question
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        {threadHierarchy.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No discussions yet. Start the conversation!</p>
          </Card>
        ) : (
          threadHierarchy.map(msg => (
            <Card key={msg.id} className="p-4">
              <MessageNode msg={msg} />
            </Card>
          ))
        )}
      </div>
    </div>
  );
});

DiscussionThread.displayName = "DiscussionThread";

export default DiscussionThread;
