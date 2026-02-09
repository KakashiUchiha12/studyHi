"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Users, Info, ClipboardList, ArrowLeft } from "lucide-react";
import Link from "next/link";
import StreamTab from "@/components/classes/StreamTab";
import AssignmentsTab from "@/components/classes/AssignmentsTab";
import PeopleTab from "@/components/classes/PeopleTab";
import AboutTab from "@/components/classes/AboutTab";

interface ClassData {
  id: string;
  name: string;
  subject?: string;
  description?: string;
  schedule?: string;
  room?: string;
  banner?: string;
  icon?: string;
  inviteCode: string;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    members: number;
    posts: number;
    assignments: number;
  };
  members: Array<{
    role: string;
    status: string;
  }>;
}

export default function ClassDetailPage() {
  const params = useParams();
  const classId = params.id as string;
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stream");

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  const fetchClassData = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}`);
      if (response.ok) {
        const data = await response.json();
        setClassData(data);
      }
    } catch (error) {
      console.error("Failed to fetch class data:", error);
    } finally {
      setLoading(false);
    }
  };

  const userRole = classData?.members[0]?.role || "student";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Class not found
          </h2>
          <Link href="/classes">
            <Button>Back to Classes</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Banner */}
      <div
        className="h-48 bg-gradient-to-r from-blue-500 to-purple-500 relative"
        style={
          classData.banner
            ? { backgroundImage: `url(${classData.banner})`, backgroundSize: "cover", backgroundPosition: "center" }
            : {}
        }
      >
        <div className="container mx-auto px-4 h-full flex items-end pb-4">
          <Link href="/classes">
            <Button variant="secondary" className="gap-2 mb-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      {/* Class Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            {classData.icon ? (
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 -mt-12 bg-white dark:bg-gray-800">
                <img
                  src={classData.icon}
                  alt={classData.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 -mt-12 flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-blue-500" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {classData.name}
              </h1>
              {classData.subject && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {classData.subject}
                </p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                {classData.schedule && <span>{classData.schedule}</span>}
                {classData.room && <span>• {classData.room}</span>}
                <span>• {classData._count.members} members</span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="stream" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Stream
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              Assignments
              {classData._count.assignments > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white">
                  {classData._count.assignments}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="people" className="gap-2">
              <Users className="w-4 h-4" />
              People
            </TabsTrigger>
            <TabsTrigger value="about" className="gap-2">
              <Info className="w-4 h-4" />
              About
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stream">
            <StreamTab classId={classId} userRole={userRole} />
          </TabsContent>

          <TabsContent value="assignments">
            <AssignmentsTab classId={classId} userRole={userRole} />
          </TabsContent>

          <TabsContent value="people">
            <PeopleTab classId={classId} userRole={userRole} />
          </TabsContent>

          <TabsContent value="about">
            <AboutTab classId={classId} classData={classData} userRole={userRole} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
