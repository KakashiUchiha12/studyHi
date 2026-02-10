"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"

const CATEGORIES = [
    "Web Development",
    "Mobile Development",
    "Data Science",
    "Machine Learning",
    "Game Development",
    "Design",
    "Other",
]

const SORT_OPTIONS = [
    { value: "newest", label: "Newest" },
    { value: "popular", label: "Popular" },
    { value: "mostLiked", label: "Most Liked" },
    { value: "mostViewed", label: "Most Viewed" },
]

export function ProjectsFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [search, setSearch] = useState(searchParams.get("search") || "")
    const [category, setCategory] = useState(searchParams.get("category") || "all")
    const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "newest")

    const updateFilters = (updates: Record<string, string>) => {
        const params = new URLSearchParams(searchParams.toString())

        Object.entries(updates).forEach(([key, value]) => {
            if (value && value !== "all") {
                params.set(key, value)
            } else {
                params.delete(key)
            }
        })

        router.push(`/projects?${params.toString()}`)
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        updateFilters({ search })
    }

    const handleCategoryChange = (value: string) => {
        setCategory(value)
        updateFilters({ category: value })
    }

    const handleSortChange = (value: string) => {
        setSortBy(value)
        updateFilters({ sortBy: value })
    }

    const clearFilters = () => {
        setSearch("")
        setCategory("all")
        setSortBy("newest")
        router.push("/projects")
    }

    const hasActiveFilters = search || category !== "all" || sortBy !== "newest"

    return (
        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search projects..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button type="submit">Search</Button>
            </form>

            <div className="flex flex-wrap gap-3">
                <Select value={category} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                                {cat}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {hasActiveFilters && (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                        <X className="h-4 w-4 mr-2" />
                        Clear Filters
                    </Button>
                )}
            </div>
        </div>
    )
}
