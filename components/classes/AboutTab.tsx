"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Calendar, MapPin, Copy, Check } from "lucide-react";
import { useState } from "react";

interface ClassData {
  id: string;
  name: string;
  subject?: string;
  description?: string;
  schedule?: string;
  room?: string;
  inviteCode: string;
  owner: {
    name: string;
    email: string;
  };
}

export default function AboutTab({
  classId,
  classData,
  userRole,
}: {
  classId: string;
  classData: ClassData;
  userRole: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(classData.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Class Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Class Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {classData.description && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Description</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {classData.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classData.subject && (
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">Subject</h3>
                <p className="text-gray-700 dark:text-gray-300">{classData.subject}</p>
              </div>
            )}

            {classData.schedule && (
              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Schedule</h3>
                  <p className="text-gray-700 dark:text-gray-300">{classData.schedule}</p>
                </div>
              </div>
            )}

            {classData.room && (
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Room</h3>
                  <p className="text-gray-700 dark:text-gray-300">{classData.room}</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">Teacher</h3>
              <p className="text-gray-700 dark:text-gray-300">{classData.owner.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{classData.owner.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invite Code */}
      {(userRole === "admin" || userRole === "teacher") && (
        <Card>
          <CardHeader>
            <CardTitle>Class Code</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Share this code with students to let them join the class
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <code className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
                  {classData.inviteCode}
                </code>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyInviteCode}
                className="h-14 w-14"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Class Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Class Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            No resources yet
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
