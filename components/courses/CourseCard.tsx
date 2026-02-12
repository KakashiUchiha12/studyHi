"use client";

import { memo, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, BookOpen, Clock, Eye } from "lucide-react";

interface LearningCardProps {
  courseData: {
    id: string;
    title: string;
    slug: string;
    shortDescription?: string;
    courseImage?: string;
    category: string;
    difficulty: string;
    price: number;
    isPaid: boolean;
    currency: string;
    enrollmentCount: number;
    averageRating: number;
    ratingCount: number;
    instructor: {
      name: string;
      image?: string;
    };
    viewCount?: number;
    modules?: Array<{ chapters: Array<any> }>;
  };
}

const CourseCard = memo(({ courseData }: LearningCardProps) => {
  const contentMetrics = useMemo(() => {
    let chapterSum = 0;
    if (courseData.modules && Array.isArray(courseData.modules)) {
      courseData.modules.forEach(m => {
        if (m.chapters && Array.isArray(m.chapters)) {
          chapterSum += m.chapters.length;
        }
      });
    }
    return { lessonTotal: chapterSum };
  }, [courseData.modules]);

  const levelBadgeStyle = useMemo(() => {
    const styleMap = new Map([
      ["beginner", "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"],
      ["intermediate", "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"],
      ["advanced", "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"]
    ]);
    return styleMap.get(courseData.difficulty) || styleMap.get("beginner");
  }, [courseData.difficulty]);

  const costLabel = useMemo(() => {
    if (!courseData.isPaid) return "No Cost";
    const formattedAmt = courseData.price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${courseData.currency} ${formattedAmt}`;
  }, [courseData.isPaid, courseData.price, courseData.currency]);

  const buildRatingVisual = () => {
    const starElements = [];
    const scoreVal = courseData.averageRating;
    for (let position = 0; position < 5; position++) {
      const coverage = Math.min(Math.max(scoreVal - position, 0), 1);
      const keyId = `star-${position}-${courseData.id}`;
      starElements.push(
        <span key={keyId} className="relative inline-block w-4 h-4">
          <Star className="w-full h-full text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
          {coverage > 0 && (
            <span
              className="absolute top-0 left-0 h-full overflow-hidden"
              style={{ width: `${coverage * 100}%` }}
            >
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" strokeWidth={1.5} />
            </span>
          )}
        </span>
      );
    }
    return starElements;
  };

  const teacherInitial = useMemo(() => {
    const nameParts = courseData.instructor.name.trim().split(/\s+/);
    if (nameParts.length > 1) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    }
    return courseData.instructor.name.substring(0, 2).toUpperCase();
  }, [courseData.instructor.name]);

  return (
    <Link href={`/courses/${courseData.slug}`} className="block group">
      <Card className="overflow-hidden transition-all duration-200 group-hover:shadow-xl group-hover:translate-y-[-4px] h-full flex flex-col border-border/40 bg-card p-0 gap-0">
        <div className="relative aspect-video w-full bg-muted/30 overflow-hidden">
          {courseData.courseImage ? (
            <Image
              src={courseData.courseImage}
              alt={courseData.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={true}
            />
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <BookOpen className="w-10 h-10 text-muted-foreground/20" strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="secondary" className={`${levelBadgeStyle} text-[10px] px-2 py-0 h-5 font-medium border-none shadow-sm`}>
              {courseData.difficulty.charAt(0).toUpperCase() + courseData.difficulty.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="p-3.5 flex-1 flex flex-col space-y-2.5">
          <Badge variant="outline" className="text-[10px] w-fit font-medium py-0 h-4 px-1.5 opacity-70">
            {courseData.category}
          </Badge>

          <h3 className="font-bold text-sm leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors">
            {courseData.title}
          </h3>

          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold border border-border">
              {teacherInitial}
            </div>
            <span className="text-xs text-muted-foreground truncate font-medium">
              {courseData.instructor.name}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {buildRatingVisual()}
            <span className="ml-1 text-xs font-bold text-foreground">
              {courseData.averageRating.toFixed(1)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
            <span className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>{courseData.enrollmentCount}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Eye className="w-3 h-3" />
              <span>{courseData.viewCount || 0}</span>
            </span>
            {contentMetrics.lessonTotal > 0 && (
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{contentMetrics.lessonTotal} chapters</span>
              </span>
            )}
          </div>

          <div className="mt-auto pt-2 flex items-center justify-between">
            <span className="text-base font-black text-primary tracking-tight">
              {costLabel}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
});

CourseCard.displayName = "CourseCard";

export default CourseCard;
