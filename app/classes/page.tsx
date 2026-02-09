"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Search, GraduationCap } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

interface Class {
  id: string;
  name: string;
  subject?: string;
  description?: string;
  banner?: string;
  icon?: string;
  _count: {
    members: number;
  };
  members: Array<{
    role: string;
    status: string;
  }>;
}

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter(
    (cls) =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-500";
      case "teacher":
        return "bg-blue-500";
      case "student":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500 rounded-lg">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  My Classes
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your classes and assignments
                </p>
              </div>
            </div>
            <Link href="/classes/create">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Class
              </Button>
            </Link>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse bg-white dark:bg-gray-800 rounded-lg h-64"
              />
            ))}
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No classes found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Create your first class to get started"}
            </p>
            {!searchQuery && (
              <Link href="/classes/create">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Class
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((cls) => (
              <Link href={`/classes/${cls.id}`} key={cls.id}>
                <div className="group cursor-pointer bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  {/* Banner */}
                  <div
                    className="h-32 bg-gradient-to-r from-blue-500 to-purple-500 relative"
                    style={
                      cls.banner
                        ? { backgroundImage: `url(${cls.banner})`, backgroundSize: "cover", backgroundPosition: "center" }
                        : {}
                    }
                  >
                    {/* Icon */}
                    {cls.icon ? (
                      <div className="absolute -bottom-6 left-4 w-16 h-16 rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 overflow-hidden">
                        <img
                          src={cls.icon}
                          alt={cls.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="absolute -bottom-6 left-4 w-16 h-16 rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-blue-500" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="pt-10 px-6 pb-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                          {cls.name}
                        </h3>
                        {cls.subject && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {cls.subject}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs text-white ${getRoleBadgeColor(
                          cls.members[0]?.role || "student"
                        )}`}
                      >
                        {cls.members[0]?.role || "student"}
                      </span>
                    </div>

                    {cls.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                        {cls.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {cls._count.members} member{cls._count.members !== 1 ? "s" : ""}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="group-hover:bg-blue-50 dark:group-hover:bg-gray-700"
                      >
                        View Class
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
