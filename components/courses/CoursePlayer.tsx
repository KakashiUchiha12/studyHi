"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, FileText, Download, ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QuizComponent from "./QuizComponent";
import { ImageViewer } from "@/components/ui/image-viewer";

interface LessonContent {
  id: string;
  title: string;
  contentType: string;
  content?: string;
  videoUrl?: string;
  fileUrl?: string;
  fileName?: string;
  order: number;
  quiz?: any;
  imageUrl?: string | null;
  images?: string | null;
}

interface PlayerProps {
  chapterInfo: {
    id: string;
    title: string;
    description?: string;
    sections: LessonContent[];
  } | null;
  courseId: string;
  enrollmentId: string;
  onComplete: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  hasNext: boolean;
  hasPrev: boolean;
}

const CoursePlayer = memo(({ chapterInfo, courseId, enrollmentId, onComplete, onNavigate, hasNext, hasPrev }: PlayerProps) => {
  const [activeSection, setActiveSection] = useState(0);
  const [completionTracker, setCompletionTracker] = useState<Set<string>>(new Set());
  const [markingComplete, setMarkingComplete] = useState(false);
  const { toast } = useToast();
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!chapterInfo || !chapterInfo.sections || chapterInfo.sections.length === 0) {
    return (
      <Card className="h-full flex items-center justify-center p-12 bg-muted/30">
        <div className="text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">No content available for this chapter</p>
        </div>
      </Card>
    );
  }

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
      const res = await fetch(`/api/courses/${courseId}/chapters/${chapterInfo!.id}/complete`, {
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

  const handleVideoEnd = useCallback(() => {
    if (activeSection < chapterInfo.sections.length - 1) {
      moveToSection(activeSection + 1);
      toast({ title: "Lesson Complete", description: "Moving to next section..." });
    } else {
      toast({ title: "Video Finished", description: "You've reached the end of this chapter's videos!" });
    }
  }, [activeSection, chapterInfo.sections.length, moveToSection, toast]);

  const VideoPlayer = ({ url, onVideoEnd }: { url: string, onVideoEnd?: () => void }) => {
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

    const extractTimeParam = (rawUrl: string, paramNames: string[]) => {
      try {
        const urlObj = new URL(rawUrl);
        for (const param of paramNames) {
          const val = urlObj.searchParams.get(param);
          if (val) return val.replace('s', '');
        }
      } catch (e) { }

      const pattern = new RegExp(`[?&](${paramNames.join('|')})=(\\d+)`);
      const match = rawUrl.match(pattern);
      return match ? match[2] : null;
    };

    const videoId = extractVideoId(url);
    const startTime = extractTimeParam(url, ['t', 'start']);
    const endTime = extractTimeParam(url, ['end']);
    const isYT = url.includes('youtube') || url.includes('youtu.be');

    if (isYT && videoId) {
      return (
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
          <YouTubePlayer
            videoId={videoId}
            start={startTime ? parseInt(startTime) : undefined}
            end={endTime ? parseInt(endTime) : undefined}
            onEnd={onVideoEnd}
          />
        </div>
      );
    }

    const embedUrl = isYT
      ? `https://www.youtube.com/embed/${videoId}?rel=0${startTime ? `&start=${startTime}` : ''}${endTime ? `&end=${endTime}` : ''}`
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

  // Helper component for YouTube API
  const YouTubePlayer = ({ videoId, start, end, onEnd }: { videoId: string, start?: number, end?: number, onEnd?: () => void }) => {
    useEffect(() => {
      // Load YouTube API if not already loaded
      if (!(window as any).YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      let player: any;
      const initPlayer = () => {
        player = new (window as any).YT.Player(`yt-player-${videoId}`, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            start: start,
            end: end,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onStateChange: (event: any) => {
              if (event.data === (window as any).YT.PlayerState.ENDED) {
                onEnd?.();
              }
            }
          }
        });
      };

      if ((window as any).YT && (window as any).YT.Player) {
        initPlayer();
      } else {
        (window as any).onYouTubeIframeAPIReady = initPlayer;
      }

      return () => {
        if (player && player.destroy) {
          player.destroy();
        }
      };
    }, [videoId, start, end, onEnd]);

    return <div id={`yt-player-${videoId}`} className="w-full h-full" />;
  };

  const TextContent = ({ text }: { text: string }) => (
    <div className="prose prose-slate dark:prose-invert max-w-none p-6 bg-muted/30 rounded-lg">
      {/* Note: Content should be sanitized server-side before storage */}
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

    let content;
    switch (currentLesson.contentType) {
      case 'video':
        content = currentLesson.videoUrl && <VideoPlayer url={currentLesson.videoUrl} onVideoEnd={handleVideoEnd} />;
        break;
      case 'text':
        content = currentLesson.content && <TextContent text={currentLesson.content} />;
        break;
      case 'file':
        content = currentLesson.fileUrl && currentLesson.fileName && (
          <FileDownload url={currentLesson.fileUrl} name={currentLesson.fileName} />
        );
        break;
      case 'quiz':
        content = currentLesson.quiz && (
          <QuizComponent
            quizData={currentLesson.quiz}
            onSubmitComplete={(score, passed) => {
              if (passed) {
                recordSectionView(currentLesson.id);
                toast({ title: "Quiz Passed!", description: `Score: ${score}%` });
              }
            }}
          />
        );
        break;
      default:
        content = <div className="text-center text-muted-foreground py-12">Content not available</div>;
    }

    const additionalImages = currentLesson.images ? (() => {
      try {
        const parsed = typeof currentLesson.images === 'string'
          ? JSON.parse(currentLesson.images)
          : currentLesson.images;
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    })() : [];

    // Prepare images for the viewer
    const allImages = [
      ...(currentLesson.imageUrl ? [{ url: currentLesson.imageUrl }] : []),
      ...additionalImages.map((img: string) => ({ url: img }))
    ];

    const handleImageClick = (index: number) => {
      setCurrentImageIndex(index);
      setIsViewerOpen(true);
    };

    return (
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-6">
        {currentLesson.imageUrl && (
          <div
            className="mb-8 rounded-xl overflow-hidden shadow-sm border aspect-video max-h-[400px] relative bg-muted cursor-pointer hover:opacity-95 transition-opacity"
            onClick={() => handleImageClick(0)}
          >
            <img
              src={currentLesson.imageUrl}
              alt={currentLesson.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {content}

        {additionalImages.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-semibold">Image Gallery</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {additionalImages.map((img: string, idx: number) => (
                <div
                  key={idx}
                  className="rounded-lg overflow-hidden border shadow-sm aspect-video bg-muted relative group cursor-pointer"
                  onClick={() => handleImageClick(currentLesson.imageUrl ? idx + 1 : idx)}
                >
                  <img
                    src={img}
                    alt={`Gallery image ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <ImageViewer
          images={allImages}
          initialIndex={currentImageIndex}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
        />
      </div>
    );
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
