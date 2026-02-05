"use client";

import { memo, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trophy, Star, Award, Target, Zap, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface BadgeItem {
  id: string;
  achievementId: string;
  isVisible: boolean;
  earnedAt: string;
  achievement: {
    badgeType: string;
    title: string;
    description: string;
    icon: string;
    criteria: string;
  };
}

interface BadgeDisplayProps {
  userBadges: BadgeItem[];
  allowVisibilityToggle?: boolean;
  variant?: "grid" | "list" | "compact";
}

const BadgeDisplay = memo(({ userBadges, allowVisibilityToggle = true, variant = "grid" }: BadgeDisplayProps) => {
  const [badgeVisibility, setBadgeVisibility] = useState<Map<string, boolean>>(
    new Map(userBadges.map(b => [b.id, b.isVisible]))
  );
  const [updatingBadge, setUpdatingBadge] = useState<string | null>(null);
  const { toast } = useToast();

  const iconMapping = {
    trophy: Trophy,
    star: Star,
    award: Award,
    target: Target,
    zap: Zap
  };

  const colorThemes = {
    gold: "from-yellow-400 to-amber-600",
    silver: "from-gray-300 to-gray-500",
    bronze: "from-orange-400 to-orange-700",
    platinum: "from-blue-300 to-indigo-500",
    diamond: "from-cyan-300 to-blue-500"
  };

  const getBadgeTheme = (type: string) => {
    if (type.includes("gold") || type.includes("complete")) return colorThemes.gold;
    if (type.includes("silver") || type.includes("intermediate")) return colorThemes.silver;
    if (type.includes("bronze") || type.includes("beginner")) return colorThemes.bronze;
    if (type.includes("platinum") || type.includes("master")) return colorThemes.platinum;
    return colorThemes.diamond;
  };

  const getBadgeIcon = (iconName: string) => {
    const IconComponent = iconMapping[iconName.toLowerCase() as keyof typeof iconMapping] || Trophy;
    return IconComponent;
  };

  const toggleBadgeVisibility = useCallback(async (badgeId: string, currentVisibility: boolean) => {
    setUpdatingBadge(badgeId);
    
    try {
      const response = await fetch(`/api/users/badges/${badgeId}/visibility`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !currentVisibility })
      });

      if (!response.ok) throw new Error("Failed to update visibility");

      setBadgeVisibility(prev => new Map(prev).set(badgeId, !currentVisibility));
      toast({
        title: "Updated",
        description: `Badge ${!currentVisibility ? "shown" : "hidden"} on your profile`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update badge visibility",
        variant: "destructive"
      });
    } finally {
      setUpdatingBadge(null);
    }
  }, [toast]);

  const BadgeCard = ({ badge, size = "default" }: { badge: BadgeItem; size?: "default" | "small" }) => {
    const IconComp = getBadgeIcon(badge.achievement.icon);
    const theme = getBadgeTheme(badge.achievement.badgeType);
    const visible = badgeVisibility.get(badge.id) ?? badge.isVisible;
    const isSmall = size === "small";

    return (
      <Card className={cn(
        "overflow-hidden transition-all hover:shadow-lg",
        !visible && "opacity-50",
        isSmall ? "p-3" : "p-5"
      )}>
        <div className="flex items-start gap-3">
          <div className={cn(
            "shrink-0 rounded-xl bg-gradient-to-br shadow-lg flex items-center justify-center",
            theme,
            isSmall ? "w-12 h-12" : "w-16 h-16"
          )}>
            <IconComp className={cn("text-white", isSmall ? "w-6 h-6" : "w-8 h-8")} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className={cn("font-bold", isSmall ? "text-sm" : "text-base")}>
                {badge.achievement.title}
              </h4>
              {allowVisibilityToggle && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => toggleBadgeVisibility(badge.id, visible)}
                  disabled={updatingBadge === badge.id}
                  title={visible ? "Hide badge" : "Show badge"}
                >
                  {visible ? (
                    <Eye className="w-3 h-3" />
                  ) : (
                    <EyeOff className="w-3 h-3" />
                  )}
                </Button>
              )}
            </div>
            
            <p className={cn("text-muted-foreground mb-2", isSmall ? "text-xs" : "text-sm")}>
              {badge.achievement.description}
            </p>

            <Badge variant="secondary" className={cn(isSmall ? "text-[10px]" : "text-xs")}>
              {new Date(badge.earnedAt).toLocaleDateString()}
            </Badge>
          </div>
        </div>

        {!isSmall && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Criteria:</span> {badge.achievement.criteria}
            </p>
          </div>
        )}
      </Card>
    );
  };

  if (userBadges.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="font-semibold text-lg mb-2">No Badges Yet</h3>
        <p className="text-muted-foreground text-sm">
          Complete courses and achieve milestones to earn badges!
        </p>
      </Card>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap gap-2">
        {userBadges.map(badge => {
          const IconComp = getBadgeIcon(badge.achievement.icon);
          const theme = getBadgeTheme(badge.achievement.badgeType);
          const visible = badgeVisibility.get(badge.id) ?? badge.isVisible;

          return (
            <div
              key={badge.id}
              className={cn(
                "w-12 h-12 rounded-lg bg-gradient-to-br shadow flex items-center justify-center",
                theme,
                !visible && "opacity-30"
              )}
              title={badge.achievement.title}
            >
              <IconComp className="w-6 h-6 text-white" />
            </div>
          );
        })}
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className="space-y-3">
        {userBadges.map(badge => (
          <BadgeCard key={badge.id} badge={badge} size="small" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {userBadges.map(badge => (
        <BadgeCard key={badge.id} badge={badge} />
      ))}
    </div>
  );
});

BadgeDisplay.displayName = "BadgeDisplay";

export default BadgeDisplay;
