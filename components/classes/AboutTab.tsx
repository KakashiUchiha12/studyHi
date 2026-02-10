"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Info, Calendar, MapPin, Copy, Check, Share2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

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
  const { toast } = useToast();

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(classData.inviteCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Class code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareInviteCode = async () => {
    const shareText = `Join my class "${classData.name}" using code: ${classData.inviteCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${classData.name}`,
          text: shareText,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log("Share cancelled");
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(shareText);
      toast({
        title: "Copied!",
        description: "Share message copied to clipboard",
      });
    }
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

      {/* Invite Code - Enhanced for Admin/Teacher */}
      {(userRole === "admin" || userRole === "teacher") && (
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
              <Share2 className="w-5 h-5" />
              Class Code - Share with Students
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
              Students can use this code to join your class. Share it via email, message, or write it on the board.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-300 dark:border-blue-700 shadow-sm">
                <div className="text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 uppercase tracking-wide font-medium">
                    Class Code
                  </p>
                  <code className="text-3xl sm:text-4xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                    {classData.inviteCode}
                  </code>
                </div>
              </div>
              <div className="flex sm:flex-col gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyInviteCode}
                  className="h-14 w-full sm:w-14 flex-1 sm:flex-none bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900"
                  title="Copy code"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShareInviteCode}
                  className="h-14 w-full sm:w-14 flex-1 sm:flex-none bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900"
                  title="Share code"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded p-3">
              <strong>💡 Tip:</strong> Students can join by clicking "Join Class" on the Classes page and entering this code.
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
