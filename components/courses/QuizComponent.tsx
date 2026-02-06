"use client";

import { memo, useState, useCallback, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertCircle, Clock, Trophy, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [activeStep, setActiveStep] = useState(0);
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
  }, [toast]);

  const recordAnswer = useCallback((questionId: string, selectedOption: string) => {
    setUserSelections(prev => new Map(prev).set(questionId, selectedOption));
  }, []);

  const parseOptions = (optionsStr: string): QuizAnswer[] => {
    try {
      const parsed = JSON.parse(optionsStr);
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
        return parsed.map((text, idx) => ({ id: `opt-${idx}`, text }));
      }
      return parsed;
    } catch (e) {
      return [];
    }
  };

  const parseCorrectAnswers = (correctStr: string, options: QuizAnswer[]): string[] => {
    try {
      const parsed = JSON.parse(correctStr);
      if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
        // If it's a string array, find the matching IDs from our normalized options
        return parsed.map(text => options.find(o => o.text === text)?.id).filter(Boolean) as string[];
      }
      return parsed;
    } catch (e) {
      return [];
    }
  };

  const processSubmission = useCallback(async () => {
    const results = new Map<string, boolean>();
    let correctCount = 0;

    orderedQuestions.forEach(problem => {
      const options = parseOptions(problem.options);
      const userChoice = userSelections.get(problem.id);
      const correctOpts = parseCorrectAnswers(problem.correctAnswers, options);
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

  const currentQuestion = orderedQuestions[activeStep];

  return (
    <div className="light bg-white text-slate-900 rounded-xl overflow-hidden p-1">
      <div className="space-y-6">
        <Card className="p-6 bg-slate-50 border-slate-200">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2 text-slate-900">{quizData.title}</h2>
              {quizData.description && (
                <p className="text-slate-600">{quizData.description}</p>
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
                <span className="text-slate-500">Question {activeStep + 1} of {orderedQuestions.length}</span>
                <span className="font-medium text-blue-600">{Math.round(progressPercent)}% answered</span>
              </div>
              <Progress value={(activeStep / orderedQuestions.length) * 100} className="h-2 bg-slate-200" />
            </div>
          )}

          {quizSubmitted && (
            <Card className="p-4 mb-6 bg-white border-blue-100 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900">Quiz Results</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="text-2xl font-black text-blue-600">
                      {((evaluationResults.size > 0 ? Array.from(evaluationResults.values()).filter(Boolean).length : 0) / orderedQuestions.length * 100).toFixed(0)}%
                    </div>
                    <p className="text-slate-600 font-medium">
                      You got {Array.from(evaluationResults.values()).filter(Boolean).length} out of {orderedQuestions.length} correct
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </Card>

        <div className="space-y-4">
          {orderedQuestions.map((problem, idx) => {
            if (!quizSubmitted && idx !== activeStep) return null;

            const options = parseOptions(problem.options);
            const userAnswer = userSelections.get(problem.id);
            const isCorrect = evaluationResults.get(problem.id);
            const correctOpts = quizSubmitted ? parseCorrectAnswers(problem.correctAnswers, options) : [];

            return (
              <Card key={problem.id} className={cn(
                "p-6 transition-all duration-300 border-2",
                quizSubmitted && isCorrect && "border-green-500 bg-green-50 shadow-sm shadow-green-200/50",
                quizSubmitted && isCorrect === false && "border-red-500 bg-red-50 shadow-sm shadow-red-200/50",
                !quizSubmitted && "border-slate-100 shadow-lg bg-white"
              )}>
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                    {idx + 1}
                  </div>
                  <h3 className="text-xl font-bold leading-snug flex-1 text-slate-900">{problem.question}</h3>
                  {quizSubmitted && (
                    isCorrect ? (
                      <CheckCircle2 className="w-7 h-7 text-green-600 shrink-0" />
                    ) : (
                      <XCircle className="w-7 h-7 text-red-600 shrink-0" />
                    )
                  )}
                </div>

                <RadioGroup
                  value={userAnswer || ""}
                  onValueChange={(val) => !quizSubmitted && recordAnswer(problem.id, val)}
                  disabled={quizSubmitted}
                >
                  <div className="grid gap-4">
                    {options.map((opt) => {
                      const isSelected = userAnswer === opt.id;
                      const isCorrectOpt = quizSubmitted && correctOpts.includes(opt.id);

                      return (
                        <div
                          key={opt.id}
                          role="button"
                          onClick={() => !quizSubmitted && recordAnswer(problem.id, opt.id)}
                          className={cn(
                            "flex items-center space-x-4 p-5 rounded-xl border-2 transition-all cursor-pointer group bg-white",
                            isSelected && !quizSubmitted && "border-blue-600 bg-blue-50/50 shadow-md",
                            quizSubmitted && isCorrectOpt && "border-green-500 bg-green-100",
                            quizSubmitted && isSelected && !isCorrectOpt && "border-red-500 bg-red-100",
                            !quizSubmitted && !isSelected && "hover:border-blue-400 hover:bg-slate-50 border-slate-200"
                          )}
                        >
                          <RadioGroupItem
                            value={opt.id}
                            id={`${problem.id}-${opt.id}`}
                            className="w-5 h-5 shrink-0 border-slate-300"
                          />
                          <Label
                            htmlFor={`${problem.id}-${opt.id}`}
                            className="flex-1 text-lg font-bold cursor-pointer text-slate-900 leading-relaxed"
                          >
                            {opt.text}
                          </Label>
                          {quizSubmitted && isCorrectOpt && (
                            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>

                {quizSubmitted && quizData.showAnswers && problem.explanation && (
                  <div className="mt-8 p-5 bg-blue-50 rounded-xl border border-blue-200 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm font-black text-blue-900 mb-1 uppercase tracking-wider">
                          Explanation
                        </p>
                        <p className="text-lg text-blue-800 leading-relaxed font-medium">
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
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
              disabled={activeStep === 0}
              size="lg"
              className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-3">
              {activeStep < orderedQuestions.length - 1 ? (
                <Button
                  onClick={() => setActiveStep(prev => prev + 1)}
                  size="lg"
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={processSubmission}
                  disabled={answeredCount < orderedQuestions.length}
                  size="lg"
                  className="px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                >
                  Submit Quiz
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

QuizComponent.displayName = "QuizComponent";

export default QuizComponent;
