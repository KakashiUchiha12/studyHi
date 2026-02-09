"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, FileText, CheckCircle, Clock } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  instructions: string;
  dueDate: string;
  points: number;
  allowLateSubmission: boolean;
  user: {
    name: string;
  };
  _count: {
    submissions: number;
  };
  submissions: Array<{
    id: string;
    submittedAt: string;
    isLate: boolean;
    grade?: number;
  }>;
}

export default function AssignmentsTab({ classId, userRole }: { classId: string; userRole: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    instructions: "",
    dueDate: "",
    points: 100,
  });

  useEffect(() => {
    fetchAssignments();
  }, [classId]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch(`/api/classes/${classId}/assignments`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/classes/${classId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setCreateOpen(false);
        setFormData({ title: "", instructions: "", dueDate: "", points: 100 });
        fetchAssignments();
      }
    } catch (error) {
      console.error("Failed to create assignment:", error);
    }
  };

  const getStatusBadge = (assignment: Assignment) => {
    const submission = assignment.submissions[0];
    if (submission) {
      if (submission.grade !== undefined && submission.grade !== null) {
        return (
          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Graded: {submission.grade}/{assignment.points}
          </span>
        );
      }
      return (
        <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <CheckCircle className="w-3 h-3 inline mr-1" />
          Submitted
        </span>
      );
    }

    const dueDate = new Date(assignment.dueDate);
    const now = new Date();
    if (now > dueDate) {
      return (
        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          Missing
        </span>
      );
    }

    return (
      <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
        <Clock className="w-3 h-3 inline mr-1" />
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      {(userRole === "admin" || userRole === "teacher") && (
        <div className="flex justify-end">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    rows={4}
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="datetime-local"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full">Create Assignment</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Assignments List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No assignments yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{assignment.title}</CardTitle>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Due: {new Date(assignment.dueDate).toLocaleString()}
                      </span>
                      <span>{assignment.points} points</span>
                    </div>
                  </div>
                  {userRole === "student" && getStatusBadge(assignment)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4">
                  {assignment.instructions}
                </p>
                {userRole === "student" && !assignment.submissions[0] && (
                  <Button>Submit Assignment</Button>
                )}
                {(userRole === "admin" || userRole === "teacher") && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {assignment._count.submissions} submission(s)
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
