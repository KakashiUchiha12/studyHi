"use client";

import { memo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Calendar } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

interface AnnouncementData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface AnnouncementCardProps {
  announcement: AnnouncementData;
  variant?: "default" | "compact";
  className?: string;
}

const AnnouncementCard = memo(({ announcement, variant = "default", className }: AnnouncementCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(announcement.createdAt), { addSuffix: true });
  const fullDate = format(new Date(announcement.createdAt), "PPP");
  
  const isRecent = () => {
    const hoursSincePost = (Date.now() - new Date(announcement.createdAt).getTime()) / (1000 * 60 * 60);
    return hoursSincePost < 24;
  };

  if (variant === "compact") {
    return (
      <Card className={cn("p-4 hover:shadow-md transition-shadow", className)}>
        <div className="flex gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
            <Megaphone className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-semibold text-sm line-clamp-1">{announcement.title}</h4>
              {isRecent() && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                  New
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
              {announcement.content}
            </p>
            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn("p-6 border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow", className)}>
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-md">
            <Megaphone className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">{announcement.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground" title={fullDate}>
                {timeAgo}
              </span>
            </div>
          </div>
        </div>
        {isRecent() && (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            New
          </Badge>
        )}
      </div>

      <div className="pl-15">
        <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {announcement.content}
        </p>
      </div>
    </Card>
  );
});

AnnouncementCard.displayName = "AnnouncementCard";

export default AnnouncementCard;
