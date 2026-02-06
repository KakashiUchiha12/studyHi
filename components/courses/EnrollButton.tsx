"use client";

import { memo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2, Check, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface EnrollButtonProps {
  courseIdentifier: string;
  isCurrentlyEnrolled: boolean;
  onEnrollmentChange?: (enrolled: boolean) => void;
}

const EnrollButton = memo(({
  courseIdentifier,
  isCurrentlyEnrolled,
  onEnrollmentChange
}: EnrollButtonProps) => {
  const [processingAction, setProcessingAction] = useState(false);
  const [enrollmentState, setEnrollmentState] = useState(isCurrentlyEnrolled);
  const [actionComplete, setActionComplete] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const performEnrollment = useCallback(async () => {
    setProcessingAction(true);
    setActionComplete(false);

    try {
      const endpoint = `/api/courses/${courseIdentifier}/enroll`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Enrollment failed");
      }

      setEnrollmentState(true);
      setActionComplete(true);

      toast({
        title: "Successfully Enrolled!",
        description: "You now have access to this course content.",
        variant: "default"
      });

      onEnrollmentChange?.(true);

      setTimeout(() => {
        router.push(`/courses/${courseIdentifier}/learn`);
      }, 1200);

    } catch (error: any) {
      toast({
        title: "Enrollment Error",
        description: error.message || "Failed to enroll in course",
        variant: "destructive"
      });
    } finally {
      setProcessingAction(false);
      setTimeout(() => setActionComplete(false), 3000);
    }
  }, [courseIdentifier, toast, onEnrollmentChange, router]);

  const performUnenrollment = useCallback(async () => {
    setProcessingAction(true);
    setActionComplete(false);

    try {
      const endpoint = `/api/courses/${courseIdentifier}/unenroll`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Unenrollment failed");
      }

      setEnrollmentState(false);
      setActionComplete(true);

      toast({
        title: "Unenrolled Successfully",
        description: "You have been removed from this course.",
        variant: "default"
      });

      onEnrollmentChange?.(false);

    } catch (error: any) {
      toast({
        title: "Unenrollment Error",
        description: error.message || "Failed to unenroll from course",
        variant: "destructive"
      });
    } finally {
      setProcessingAction(false);
      setTimeout(() => setActionComplete(false), 3000);
    }
  }, [courseIdentifier, toast, onEnrollmentChange]);

  const handleButtonClick = useCallback(() => {
    if (processingAction) return;

    if (enrollmentState) {
      performUnenrollment();
    } else {
      performEnrollment();
    }
  }, [enrollmentState, processingAction, performEnrollment, performUnenrollment]);

  if (actionComplete && enrollmentState) {
    return (
      <Button size="lg" className="w-full sm:w-auto gap-2" disabled>
        <Check className="w-5 h-5" />
        Enrolled Successfully
      </Button>
    );
  }

  if (enrollmentState) {
    return (
      <Button
        variant="outline"
        size="lg"
        onClick={handleButtonClick}
        disabled={processingAction}
        className="w-full sm:w-auto gap-2 border-2"
      >
        {processingAction ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <UserMinus className="w-5 h-5" />
            Unenroll from Course
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      onClick={handleButtonClick}
      disabled={processingAction}
      className="w-full sm:w-auto gap-2"
    >
      {processingAction ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Enrolling...
        </>
      ) : (
        <>
          <UserPlus className="w-5 h-5" />
          Enroll Now - Free
        </>
      )}
    </Button>
  );
});

EnrollButton.displayName = "EnrollButton";

export default EnrollButton;
