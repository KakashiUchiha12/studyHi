"use client";

import { memo, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ChapterItem {
  id: string;
  title: string;
  order: number;
  isFree: boolean;
  isCompleted?: boolean;
  isActive?: boolean;
}

interface ModuleGroup {
  id: string;
  title: string;
  order: number;
  chapters: ChapterItem[];
}

interface ChapterListProps {
  moduleGroups: ModuleGroup[];
  activeChapterId?: string;
  onChapterSelect: (chapterId: string) => void;
  userEnrolled: boolean;
}

const ChapterList = memo(({ moduleGroups, activeChapterId, onChapterSelect, userEnrolled }: ChapterListProps) => {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules(prev => {
      const updated = new Set(prev);
      if (updated.has(moduleId)) {
        updated.delete(moduleId);
      } else {
        updated.add(moduleId);
      }
      return updated;
    });
  };

  const courseStats = useMemo(() => {
    let totalItems = 0;
    let completedItems = 0;
    moduleGroups.forEach(mod => {
      mod.chapters.forEach(ch => {
        totalItems++;
        if (ch.isCompleted) completedItems++;
      });
    });
    return { totalItems, completedItems, percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0 };
  }, [moduleGroups]);

  const findActiveModule = useMemo(() => {
    return moduleGroups.find(mod => 
      mod.chapters.some(ch => ch.id === activeChapterId)
    )?.id;
  }, [moduleGroups, activeChapterId]);

  useState(() => {
    if (findActiveModule) {
      setExpandedModules(new Set([findActiveModule]));
    }
  });

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b space-y-2">
        <h3 className="font-semibold text-lg">Course Content</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{courseStats.totalItems} chapters</span>
          <Badge variant="secondary">{courseStats.percentage}% done</Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {moduleGroups.map((module, modIdx) => {
            const isExpanded = expandedModules.has(module.id);
            const moduleComplete = module.chapters.every(ch => ch.isCompleted);
            const moduleProgress = module.chapters.filter(ch => ch.isCompleted).length;

            return (
              <Collapsible
                key={module.id}
                open={isExpanded}
                onOpenChange={() => toggleModuleExpand(module.id)}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg transition-colors",
                      "hover:bg-accent text-left",
                      isExpanded && "bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {modIdx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{module.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {moduleProgress}/{module.chapters.length} completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {moduleComplete && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                      <ChevronDown className={cn(
                        "w-4 h-4 transition-transform",
                        isExpanded && "rotate-180"
                      )} />
                    </div>
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent className="pl-4 pr-2 mt-1 space-y-1">
                  {module.chapters.map((chapter, chIdx) => {
                    const isActive = chapter.id === activeChapterId;
                    const canAccess = userEnrolled || chapter.isFree;

                    return (
                      <button
                        key={chapter.id}
                        onClick={() => canAccess && onChapterSelect(chapter.id)}
                        disabled={!canAccess}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-md transition-all text-left",
                          "hover:bg-accent/50",
                          isActive && "bg-primary/10 border-l-4 border-primary",
                          !canAccess && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div className="flex items-center justify-center w-5 h-5">
                          {chapter.isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : !canAccess ? (
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          ) : isActive ? (
                            <PlayCircle className="w-5 h-5 text-primary" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-sm truncate",
                            isActive && "font-semibold text-primary"
                          )}>
                            {chIdx + 1}. {chapter.title}
                          </p>
                        </div>
                        {chapter.isFree && !userEnrolled && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            FREE
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
});

ChapterList.displayName = "ChapterList";

export default ChapterList;
