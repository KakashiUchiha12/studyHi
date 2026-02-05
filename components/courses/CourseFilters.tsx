"use client";

import { memo, useCallback, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, SlidersHorizontal } from "lucide-react";

interface FilterConfig {
  categorySelected: string;
  levelSelected: string;
  ratingMin: number;
  costRange: string;
}

interface CourseFiltersProps {
  currentFilters: FilterConfig;
  onFilterUpdate: (filters: FilterConfig) => void;
  availableCategories?: string[];
}

const LEVEL_OPTIONS = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" }
];

const COST_OPTIONS = [
  { value: "all", label: "Any Price" },
  { value: "free", label: "Free Only" },
  { value: "paid", label: "Paid Only" }
];

const DEFAULT_CATEGORIES = [
  "Programming",
  "Design",
  "Business",
  "Marketing",
  "Data Science",
  "Personal Development"
];

const CourseFilters = memo(({ 
  currentFilters, 
  onFilterUpdate,
  availableCategories = DEFAULT_CATEGORIES
}: CourseFiltersProps) => {
  const [isPending, startTransition] = useTransition();

  const modifyFilter = useCallback((key: keyof FilterConfig, val: any) => {
    startTransition(() => {
      onFilterUpdate({ ...currentFilters, [key]: val });
    });
  }, [currentFilters, onFilterUpdate]);

  const resetAllFilters = useCallback(() => {
    startTransition(() => {
      onFilterUpdate({
        categorySelected: "all",
        levelSelected: "all",
        ratingMin: 0,
        costRange: "all"
      });
    });
  }, [onFilterUpdate]);

  const hasActiveFilters = currentFilters.categorySelected !== "all" ||
    currentFilters.levelSelected !== "all" ||
    currentFilters.ratingMin > 0 ||
    currentFilters.costRange !== "all";

  const activeFilterCount = [
    currentFilters.categorySelected !== "all",
    currentFilters.levelSelected !== "all",
    currentFilters.ratingMin > 0,
    currentFilters.costRange !== "all"
  ].filter(Boolean).length;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-lg">Filter Options</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetAllFilters}
            disabled={isPending}
            className="text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="category-filter" className="text-sm font-medium">
            Category
          </Label>
          <Select 
            value={currentFilters.categorySelected}
            onValueChange={(val) => modifyFilter("categorySelected", val)}
            disabled={isPending}
          >
            <SelectTrigger id="category-filter">
              <SelectValue placeholder="Choose category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {availableCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="level-filter" className="text-sm font-medium">
            Difficulty Level
          </Label>
          <Select 
            value={currentFilters.levelSelected}
            onValueChange={(val) => modifyFilter("levelSelected", val)}
            disabled={isPending}
          >
            <SelectTrigger id="level-filter">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {LEVEL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cost-filter" className="text-sm font-medium">
            Price Range
          </Label>
          <Select 
            value={currentFilters.costRange}
            onValueChange={(val) => modifyFilter("costRange", val)}
            disabled={isPending}
          >
            <SelectTrigger id="cost-filter">
              <SelectValue placeholder="Select price" />
            </SelectTrigger>
            <SelectContent>
              {COST_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="rating-filter" className="text-sm font-medium">
              Minimum Rating
            </Label>
            <Badge variant="outline" className="text-xs">
              {currentFilters.ratingMin.toFixed(1)} ★
            </Badge>
          </div>
          <Slider
            id="rating-filter"
            min={0}
            max={5}
            step={0.5}
            value={[currentFilters.ratingMin]}
            onValueChange={([val]) => modifyFilter("ratingMin", val)}
            disabled={isPending}
            className="py-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 ★</span>
            <span>5 ★</span>
          </div>
        </div>
      </div>
    </Card>
  );
});

CourseFilters.displayName = "CourseFilters";

export default CourseFilters;
