"use client";

import { memo, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Users, BookOpen, Clock } from "lucide-react";

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
      <Card className="overflow-hidden transition-all duration-200 group-hover:shadow-2xl group-hover:scale-[1.02] h-full flex flex-col border-2">
        <div className="relative aspect-video w-full bg-gradient-to-tr from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950">
          {courseData.courseImage ? (
            <Image
              src={courseData.courseImage}
              alt={courseData.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              priority={false}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <BookOpen className="w-20 h-20 text-indigo-300 dark:text-indigo-700" strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute top-2.5 right-2.5">
            <Badge variant="secondary" className={`${levelBadgeStyle} text-xs font-medium border`}>
              {courseData.difficulty.charAt(0).toUpperCase() + courseData.difficulty.slice(1)}
            </Badge>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col space-y-3">
          <Badge variant="outline" className="text-xs w-fit font-medium">
            {courseData.category}
          </Badge>

          <h3 className="font-semibold text-base leading-snug line-clamp-2 min-h-[2.5rem]">
            {courseData.title}
          </h3>

          {courseData.shortDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {courseData.shortDescription}
            </p>
          )}

          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
              {teacherInitial}
            </div>
            <span className="text-sm text-muted-foreground truncate">
              {courseData.instructor.name}
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            {buildRatingVisual()}
            <span className="ml-1.5 text-sm font-semibold text-foreground">
              {courseData.averageRating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({courseData.ratingCount})
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span className="flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5" strokeWidth={2} />
              <span>{courseData.enrollmentCount}</span>
            </span>
            {contentMetrics.lessonTotal > 0 && (
              <span className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                <span>{contentMetrics.lessonTotal} chapters</span>
              </span>
            )}
          </div>

          <div className="mt-auto pt-3 border-t flex items-center justify-between">
            <span className="text-xl font-bold text-primary">
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
