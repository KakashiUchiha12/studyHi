"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, FileText, Download, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LessonContent {
  id: string;
  title: string;
  contentType: string;
  content?: string;
  videoUrl?: string;
  fileUrl?: string;
  fileName?: string;
  order: number;
}

interface PlayerProps {
  chapterInfo: {
    id: string;
    title: string;
    description?: string;
    sections: LessonContent[];
  };
  enrollmentId: string;
  onComplete: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const CoursePlayer = memo(({ chapterInfo, enrollmentId, onComplete, onNavigate, hasNext, hasPrev }: PlayerProps) => {
  const [activeSection, setActiveSection] = useState(0);
  const [completionTracker, setCompletionTracker] = useState<Set<string>>(new Set());
  const [markingComplete, setMarkingComplete] = useState(false);
  const { toast } = useToast();

  const currentLesson = chapterInfo.sections[activeSection];
  const sectionProgress = `${activeSection + 1}/${chapterInfo.sections.length}`;

  const recordSectionView = useCallback((sectionId: string) => {
    setCompletionTracker(prev => new Set(prev).add(sectionId));
  }, []);

  useEffect(() => {
    if (currentLesson) {
      recordSectionView(currentLesson.id);
    }
  }, [currentLesson, recordSectionView]);

  const moveToSection = useCallback((index: number) => {
    if (index >= 0 && index < chapterInfo.sections.length) {
      setActiveSection(index);
    }
  }, [chapterInfo.sections.length]);

  const triggerChapterComplete = useCallback(async () => {
    setMarkingComplete(true);
    try {
      const res = await fetch(`/api/courses/${enrollmentId}/chapters/${chapterInfo.id}/complete`, {
        method: "POST"
      });
      if (res.ok) {
        toast({ title: "Chapter Completed!", description: "Great work! Moving forward..." });
        onComplete();
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to mark complete", variant: "destructive" });
    } finally {
      setMarkingComplete(false);
    }
  }, [enrollmentId, chapterInfo.id, onComplete, toast]);

  const VideoPlayer = ({ url }: { url: string }) => {
    const extractVideoId = (rawUrl: string) => {
      if (rawUrl.includes('youtube.com') || rawUrl.includes('youtu.be')) {
        const match = rawUrl.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&?\s]+)/);
        return match ? match[1] : null;
      }
      if (rawUrl.includes('vimeo.com')) {
        const match = rawUrl.match(/vimeo\.com\/(\d+)/);
        return match ? match[1] : null;
      }
      return null;
    };

    const videoId = extractVideoId(url);
    const isYT = url.includes('youtube') || url.includes('youtu.be');
    const embedUrl = isYT 
      ? `https://www.youtube.com/embed/${videoId}?rel=0`
      : `https://player.vimeo.com/video/${videoId}`;

    return (
      <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
        {videoId ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="flex items-center justify-center h-full text-white">
            <Play className="w-16 h-16 opacity-50" />
          </div>
        )}
      </div>
    );
  };

  const TextContent = ({ text }: { text: string }) => (
    <div className="prose prose-slate dark:prose-invert max-w-none p-6 bg-muted/30 rounded-lg">
      <div dangerouslySetInnerHTML={{ __html: text }} />
    </div>
  );

  const FileDownload = ({ url, name }: { url: string; name: string }) => (
    <Card className="p-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold">{name}</h4>
          <p className="text-sm text-muted-foreground">Downloadable resource</p>
        </div>
      </div>
      <Button asChild>
        <a href={url} download>
          <Download className="w-4 h-4 mr-2" />
          Download
        </a>
      </Button>
    </Card>
  );

  const renderCurrentContent = () => {
    if (!currentLesson) return null;

    switch (currentLesson.contentType) {
      case 'video':
        return currentLesson.videoUrl && <VideoPlayer url={currentLesson.videoUrl} />;
      case 'text':
        return currentLesson.content && <TextContent text={currentLesson.content} />;
      case 'file':
        return currentLesson.fileUrl && currentLesson.fileName && (
          <FileDownload url={currentLesson.fileUrl} name={currentLesson.fileName} />
        );
      default:
        return <div className="text-center text-muted-foreground py-12">Content not available</div>;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{chapterInfo.title}</h2>
            {chapterInfo.description && (
              <p className="text-muted-foreground">{chapterInfo.description}</p>
            )}
          </div>
          <Badge variant="secondary">{sectionProgress}</Badge>
        </div>

        <Tabs value={String(activeSection)} onValueChange={(v) => moveToSection(Number(v))}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {chapterInfo.sections.map((sec, idx) => (
              <TabsTrigger key={sec.id} value={String(idx)} className="gap-2">
                {completionTracker.has(sec.id) && <CheckCircle className="w-3 h-3" />}
                {sec.title}
              </TabsTrigger>
            ))}
          </TabsList>

          {chapterInfo.sections.map((sec, idx) => (
            <TabsContent key={sec.id} value={String(idx)} className="mt-4">
              {renderCurrentContent()}
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex items-center justify-between mt-6 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => activeSection > 0 ? moveToSection(activeSection - 1) : onNavigate('prev')}
            disabled={activeSection === 0 && !hasPrev}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {activeSection === chapterInfo.sections.length - 1 ? (
            <Button onClick={triggerChapterComplete} disabled={markingComplete}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark Complete
            </Button>
          ) : (
            <Button onClick={() => moveToSection(activeSection + 1)}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
});

CoursePlayer.displayName = "CoursePlayer";

export default CoursePlayer;
