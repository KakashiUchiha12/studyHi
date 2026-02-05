"use client";

import { memo, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  completionPercentage: number;
  totalChapters: number;
  completedChapters: number;
  variant?: "default" | "compact" | "detailed";
  showLabel?: boolean;
  className?: string;
}

const ProgressBar = memo(({ 
  completionPercentage,
  totalChapters,
  completedChapters,
  variant = "default",
  showLabel = true,
  className = ""
}: ProgressBarProps) => {
  const sanitizedProgress = useMemo(() => {
    const clamped = Math.min(Math.max(completionPercentage, 0), 100);
    return Math.round(clamped * 10) / 10;
  }, [completionPercentage]);

  const progressColorScheme = useMemo(() => {
    if (sanitizedProgress >= 100) {
      return {
        bg: "bg-green-500 dark:bg-green-600",
        text: "text-green-700 dark:text-green-300",
        badge: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      };
    } else if (sanitizedProgress >= 75) {
      return {
        bg: "bg-blue-500 dark:bg-blue-600",
        text: "text-blue-700 dark:text-blue-300",
        badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      };
    } else if (sanitizedProgress >= 50) {
      return {
        bg: "bg-purple-500 dark:bg-purple-600",
        text: "text-purple-700 dark:text-purple-300",
        badge: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      };
    } else if (sanitizedProgress >= 25) {
      return {
        bg: "bg-orange-500 dark:bg-orange-600",
        text: "text-orange-700 dark:text-orange-300",
        badge: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      };
    }
    return {
      bg: "bg-slate-500 dark:bg-slate-600",
      text: "text-slate-700 dark:text-slate-300",
      badge: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200"
    };
  }, [sanitizedProgress]);

  const statusMessage = useMemo(() => {
    if (sanitizedProgress === 100) return "Course Completed!";
    if (sanitizedProgress >= 75) return "Almost There!";
    if (sanitizedProgress >= 50) return "Halfway Through";
    if (sanitizedProgress >= 25) return "Making Progress";
    if (sanitizedProgress > 0) return "Just Started";
    return "Not Started";
  }, [sanitizedProgress]);

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full transition-all duration-500 ease-out", progressColorScheme.bg)}
            style={{ width: `${sanitizedProgress}%` }}
          />
        </div>
        <span className="text-xs font-semibold min-w-[3rem] text-right">
          {sanitizedProgress}%
        </span>
      </div>
    );
  }

  if (variant === "detailed") {
    return (
      <Card className={cn("p-4", className)}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Course Progress</h4>
              <p className="text-xs text-muted-foreground">
                {completedChapters} of {totalChapters} chapters completed
              </p>
            </div>
            <Badge className={progressColorScheme.badge}>
              {statusMessage}
            </Badge>
          </div>
          
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-700 ease-out", progressColorScheme.bg)}
              style={{ width: `${sanitizedProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className={cn("font-medium", progressColorScheme.text)}>
              {sanitizedProgress}% Complete
            </span>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              <span className="text-muted-foreground">{completedChapters}</span>
              <Circle className="w-3 h-3 text-muted-foreground ml-2" />
              <span className="text-muted-foreground">{totalChapters - completedChapters}</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span className={cn("font-semibold", progressColorScheme.text)}>
            {sanitizedProgress}%
          </span>
        </div>
      )}
      <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-700 ease-out",
            progressColorScheme.bg
          )}
          style={{ width: `${sanitizedProgress}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{completedChapters}/{totalChapters} completed</span>
          {sanitizedProgress === 100 && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              ✓ Done
            </Badge>
          )}
        </div>
      )}
    </div>
  );
});

ProgressBar.displayName = "ProgressBar";

export default ProgressBar;
