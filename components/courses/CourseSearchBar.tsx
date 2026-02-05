"use client";

import { memo, useState, useCallback, useTransition, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";

interface CourseSearchBarProps {
  initialQuery?: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
}

const CourseSearchBar = memo(({ 
  initialQuery = "",
  onSearchChange,
  placeholder = "Search for courses by title, instructor, or keywords..."
}: CourseSearchBarProps) => {
  const [searchText, setSearchText] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const triggerSearch = useDebouncedCallback((query: string) => {
    startTransition(() => {
      onSearchChange(query);
    });
  }, 400);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchText(newValue);
    triggerSearch(newValue);
  }, [triggerSearch]);

  const clearSearchField = useCallback(() => {
    setSearchText("");
    startTransition(() => {
      onSearchChange("");
    });
    inputRef.current?.focus();
  }, [onSearchChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      clearSearchField();
    }
  }, [clearSearchField]);

  useEffect(() => {
    if (initialQuery !== searchText && !isPending) {
      setSearchText(initialQuery);
    }
  }, [initialQuery, isPending]);

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className="pl-10 pr-20 h-11 text-base"
          disabled={isPending}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isPending && (
            <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
          )}
          {searchText.length > 0 && !isPending && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearSearchField}
              className="h-7 w-7 p-0"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      {searchText.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 text-xs text-muted-foreground px-1">
          Searching for: <span className="font-medium">{searchText}</span>
        </div>
      )}
    </div>
  );
});

CourseSearchBar.displayName = "CourseSearchBar";

export default CourseSearchBar;
