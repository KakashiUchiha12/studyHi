"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  courseId: string;
  enrollmentProgress: number;
  existingReview?: {
    id: string;
    rating: number;
    comment: string;
  };
  onReviewSaved: () => void;
}

const RATING_LABELS = ["Poor", "Fair", "Good", "Very Good", "Excellent"];
const MIN_PROGRESS_REQUIRED = 30;

const ReviewForm = memo(({ courseId, enrollmentProgress, existingReview, onReviewSaved }: ReviewFormProps) => {
  const [selectedRating, setSelectedRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState(existingReview?.comment || "");
  const [submissionInProgress, setSubmissionInProgress] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const canSubmitReview = enrollmentProgress >= MIN_PROGRESS_REQUIRED;

  useEffect(() => {
    const errors: string[] = [];
    if (!canSubmitReview) {
      errors.push(`You need to complete at least ${MIN_PROGRESS_REQUIRED}% of the course to leave a review`);
    }
    if (selectedRating === 0) {
      errors.push("Please select a star rating");
    }
    if (reviewText.trim().length < 10) {
      errors.push("Review comment must be at least 10 characters");
    }
    setValidationErrors(errors);
  }, [selectedRating, reviewText, canSubmitReview]);

  const persistReview = useCallback(async () => {
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Failed",
        description: validationErrors[0],
        variant: "destructive"
      });
      return;
    }

    setSubmissionInProgress(true);

    try {
      const endpoint = existingReview
        ? `/api/courses/${courseId}/reviews/${existingReview.id}`
        : `/api/courses/${courseId}/reviews`;
      
      const method = existingReview ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: selectedRating,
          comment: reviewText.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save review");
      }

      toast({
        title: existingReview ? "Review Updated" : "Review Posted",
        description: "Thank you for your feedback!",
        variant: "default"
      });

      onReviewSaved();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setSubmissionInProgress(false);
    }
  }, [courseId, selectedRating, reviewText, existingReview, validationErrors, toast, onReviewSaved]);

  const StarRatingInput = () => {
    return (
      <div className="space-y-2">
        <Label>Your Rating</Label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => {
            const isActive = (hoverRating || selectedRating) >= value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                disabled={!canSubmitReview}
              >
                <Star
                  className={cn(
                    "w-8 h-8 transition-colors",
                    isActive ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                  )}
                />
              </button>
            );
          })}
        </div>
        {selectedRating > 0 && (
          <p className="text-sm text-muted-foreground">
            {RATING_LABELS[selectedRating - 1]}
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">
        {existingReview ? "Edit Your Review" : "Write a Review"}
      </h3>

      {!canSubmitReview && (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                Review Locked
              </h4>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Complete {MIN_PROGRESS_REQUIRED}% of the course to unlock reviews. 
                Your current progress: {enrollmentProgress.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-5">
        <StarRatingInput />

        <div className="space-y-2">
          <Label htmlFor="review-comment">Your Review</Label>
          <Textarea
            id="review-comment"
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Share your experience with this course..."
            className="min-h-[120px] resize-none"
            disabled={!canSubmitReview || submissionInProgress}
            maxLength={1000}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Minimum 10 characters</span>
            <span>{reviewText.length}/1000</span>
          </div>
        </div>

        {validationErrors.length > 0 && canSubmitReview && (
          <div className="text-sm text-red-600 dark:text-red-400">
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.slice(1).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <Button
          onClick={persistReview}
          disabled={!canSubmitReview || submissionInProgress || validationErrors.length > 0}
          className="w-full sm:w-auto"
        >
          {submissionInProgress && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {existingReview ? "Update Review" : "Submit Review"}
        </Button>
      </div>
    </Card>
  );
});

ReviewForm.displayName = "ReviewForm";

export default ReviewForm;
