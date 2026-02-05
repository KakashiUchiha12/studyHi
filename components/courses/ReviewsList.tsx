"use client";

import { memo, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ReviewEntry {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    image?: string;
  };
}

interface ReviewsListProps {
  reviewEntries: ReviewEntry[];
  emptyText?: string;
}

const ReviewsList = memo(({ reviewEntries, emptyText = "No reviews yet. Be the first to share your thoughts!" }: ReviewsListProps) => {
  const sortedByRecency = useMemo(() => 
    [...reviewEntries].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ), [reviewEntries]);

  const calculateStarFill = (targetRating: number, position: number) => {
    const difference = targetRating - position;
    if (difference >= 1) return 100;
    if (difference <= 0) return 0;
    return difference * 100;
  };

  const RatingVisualizer = ({ score }: { score: number }) => {
    const starPositions = [1, 2, 3, 4, 5];
    return (
      <div className="flex items-center gap-0.5">
        {starPositions.map((pos) => {
          const fillPercent = calculateStarFill(score, pos);
          return (
            <div key={pos} className="relative w-4 h-4">
              <Star className="w-full h-full text-slate-200 dark:text-slate-700 absolute inset-0" strokeWidth={1} />
              <div 
                className="overflow-hidden absolute inset-0" 
                style={{ width: `${fillPercent}%` }}
              >
                <Star className="w-4 h-4 text-amber-500 fill-amber-500 absolute left-0" strokeWidth={1} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (sortedByRecency.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">{emptyText}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedByRecency.map((entry) => {
        const timeAgo = formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true });
        const wasEdited = entry.updatedAt !== entry.createdAt;
        const userInitials = entry.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

        return (
          <Card key={entry.id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              <Avatar className="w-11 h-11 shrink-0">
                <AvatarImage src={entry.user.image} alt={entry.user.name} />
                <AvatarFallback className="bg-gradient-to-br from-violet-400 to-fuchsia-500 text-white text-sm font-semibold">
                  {userInitials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base truncate">{entry.user.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <RatingVisualizer score={entry.rating} />
                      <span className="text-xs text-muted-foreground">
                        {timeAgo}
                        {wasEdited && " (edited)"}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-sm leading-relaxed text-foreground/90">
                  {entry.comment}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
});

ReviewsList.displayName = "ReviewsList";

export default ReviewsList;
