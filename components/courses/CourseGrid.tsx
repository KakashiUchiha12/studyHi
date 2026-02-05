"use client";

import { memo } from "react";
import CourseCard from "./CourseCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BookX } from "lucide-react";

interface CourseGridProps {
  learningItems: Array<any>;
  loading?: boolean;
  emptyMessage?: string;
}

const GridSkeleton = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, idx) => (
      <div key={`skeleton-${idx}`} className="flex flex-col space-y-3">
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    ))}
  </div>
);

const EmptyDisplay = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center py-20 px-4">
    <div className="rounded-full bg-muted p-6 mb-4">
      <BookX className="w-12 h-12 text-muted-foreground" strokeWidth={1.5} />
    </div>
    <h3 className="text-lg font-semibold mb-2">No Courses Available</h3>
    <p className="text-muted-foreground text-center max-w-md">
      {message}
    </p>
  </div>
);

const CourseGrid = memo(({ 
  learningItems, 
  loading = false, 
  emptyMessage = "We couldn't find any courses matching your criteria. Try adjusting your filters." 
}: CourseGridProps) => {
  if (loading) {
    return <GridSkeleton />;
  }

  if (!learningItems || learningItems.length === 0) {
    return <EmptyDisplay message={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
      {learningItems.map((item, position) => (
        <CourseCard 
          key={item.id || `course-${position}`} 
          courseData={item} 
        />
      ))}
    </div>
  );
});

CourseGrid.displayName = "CourseGrid";

export default CourseGrid;
