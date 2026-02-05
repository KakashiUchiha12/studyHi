"use client";

import { memo, useState, useCallback, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertCircle, Clock, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface QuizAnswer {
  id: string;
  text: string;
}

interface QuizProblem {
  id: string;
  question: string;
  questionType: string;
  options: string;
  correctAnswers: string;
  explanation?: string;
  order: number;
}

interface QuizComponentProps {
  quizData: {
    id: string;
    title: string;
    description?: string;
    passingScore?: number;
    timeLimit?: number;
    showAnswers: boolean;
    randomizeOrder: boolean;
    questions: QuizProblem[];
  };
  onSubmitComplete: (score: number, passed: boolean) => void;
}

const QuizComponent = memo(({ quizData, onSubmitComplete }: QuizComponentProps) => {
  const [userSelections, setUserSelections] = useState<Map<string, string>>(new Map());
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(quizData.timeLimit || 0);
  const [evaluationResults, setEvaluationResults] = useState<Map<string, boolean>>(new Map());
  const { toast } = useToast();

  const orderedQuestions = useMemo(() => {
    const questionList = [...quizData.questions].sort((a, b) => a.order - b.order);
    if (quizData.randomizeOrder && !quizSubmitted) {
      return questionList.sort(() => Math.random() - 0.5);
    }
    return questionList;
  }, [quizData.questions, quizData.randomizeOrder, quizSubmitted]);

  useEffect(() => {
    if (quizData.timeLimit && timeRemaining > 0 && !quizSubmitted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizData.timeLimit, timeRemaining, quizSubmitted]);

  const handleAutoSubmit = useCallback(() => {
    toast({
      title: "Time's Up!",
      description: "Quiz auto-submitted due to time limit",
      variant: "default"
    });
    processSubmission();
  }, []);

  const recordAnswer = useCallback((questionId: string, selectedOption: string) => {
    setUserSelections(prev => new Map(prev).set(questionId, selectedOption));
  }, []);

  const processSubmission = useCallback(async () => {
    const results = new Map<string, boolean>();
    let correctCount = 0;

    orderedQuestions.forEach(problem => {
      const userChoice = userSelections.get(problem.id);
      const correctOpts = JSON.parse(problem.correctAnswers);
      const isCorrect = userChoice && correctOpts.includes(userChoice);
      results.set(problem.id, !!isCorrect);
      if (isCorrect) correctCount++;
    });

    setEvaluationResults(results);
    setQuizSubmitted(true);

    const finalScore = (correctCount / orderedQuestions.length) * 100;
    const hasPassed = quizData.passingScore ? finalScore >= quizData.passingScore : true;

    try {
      await fetch(`/api/courses/quizzes/${quizData.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.fromEntries(userSelections),
          score: finalScore,
          totalQuestions: orderedQuestions.length,
          correctAnswers: correctCount,
          timeTaken: quizData.timeLimit ? quizData.timeLimit - timeRemaining : null
        })
      });

      toast({
        title: hasPassed ? "Quiz Passed!" : "Quiz Completed",
        description: `You scored ${finalScore.toFixed(1)}%`,
        variant: hasPassed ? "default" : "destructive"
      });

      onSubmitComplete(finalScore, hasPassed);
    } catch (error) {
      toast({
        title: "Submission Error",
        description: "Failed to save quiz results",
        variant: "destructive"
      });
    }
  }, [orderedQuestions, userSelections, quizData, timeRemaining, onSubmitComplete, toast]);

  const answeredCount = userSelections.size;
  const progressPercent = (answeredCount / orderedQuestions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">{quizData.title}</h2>
            {quizData.description && (
              <p className="text-muted-foreground">{quizData.description}</p>
            )}
          </div>
          {quizData.timeLimit && !quizSubmitted && (
            <Badge variant={timeRemaining < 60 ? "destructive" : "secondary"} className="gap-2">
              <Clock className="w-3 h-3" />
              {formatTime(timeRemaining)}
            </Badge>
          )}
        </div>

        {!quizSubmitted && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{answeredCount}/{orderedQuestions.length}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {quizSubmitted && (
          <Card className="p-4 mb-6 bg-muted/30">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div className="flex-1">
                <h3 className="font-semibold">Quiz Results</h3>
                <p className="text-sm text-muted-foreground">
                  Score: {((evaluationResults.size > 0 ? Array.from(evaluationResults.values()).filter(Boolean).length : 0) / orderedQuestions.length * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        )}
      </Card>

      <div className="space-y-4">
        {orderedQuestions.map((problem, idx) => {
          const parsedOptions: QuizAnswer[] = JSON.parse(problem.options);
          const userAnswer = userSelections.get(problem.id);
          const isCorrect = evaluationResults.get(problem.id);
          const correctOpts = quizSubmitted ? JSON.parse(problem.correctAnswers) : [];

          return (
            <Card key={problem.id} className={cn(
              "p-6 transition-colors",
              quizSubmitted && isCorrect && "border-green-500 bg-green-50/50 dark:bg-green-950/20",
              quizSubmitted && isCorrect === false && "border-red-500 bg-red-50/50 dark:bg-red-950/20"
            )}>
              <div className="flex items-start gap-3 mb-4">
                <Badge variant="outline" className="mt-1">{idx + 1}</Badge>
                <h3 className="text-lg font-medium flex-1">{problem.question}</h3>
                {quizSubmitted && (
                  isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600" />
                  )
                )}
              </div>

              <RadioGroup
                value={userAnswer || ""}
                onValueChange={(val) => !quizSubmitted && recordAnswer(problem.id, val)}
                disabled={quizSubmitted}
              >
                <div className="space-y-3">
                  {parsedOptions.map((opt) => {
                    const isSelected = userAnswer === opt.id;
                    const isCorrectOpt = quizSubmitted && correctOpts.includes(opt.id);

                    return (
                      <div
                        key={opt.id}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg border-2 transition-colors",
                          isSelected && !quizSubmitted && "border-primary bg-primary/5",
                          quizSubmitted && isCorrectOpt && "border-green-500 bg-green-50 dark:bg-green-950/30",
                          quizSubmitted && isSelected && !isCorrectOpt && "border-red-500 bg-red-50 dark:bg-red-950/30",
                          !quizSubmitted && "hover:bg-accent cursor-pointer"
                        )}
                      >
                        <RadioGroupItem value={opt.id} id={`${problem.id}-${opt.id}`} />
                        <Label
                          htmlFor={`${problem.id}-${opt.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          {opt.text}
                        </Label>
                        {quizSubmitted && isCorrectOpt && (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </RadioGroup>

              {quizSubmitted && quizData.showAnswers && problem.explanation && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Explanation
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {problem.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {!quizSubmitted && (
        <div className="flex justify-end">
          <Button
            onClick={processSubmission}
            disabled={answeredCount < orderedQuestions.length}
            size="lg"
          >
            Submit Quiz
          </Button>
        </div>
      )}
    </div>
  );
});

QuizComponent.displayName = "QuizComponent";

export default QuizComponent;
