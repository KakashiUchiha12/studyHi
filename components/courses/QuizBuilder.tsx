"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Check, FileSpreadsheet } from "lucide-react";

interface QuizQuestionData {
    id: string;
    question: string;
    options: string[];
    correctAnswers: string[];
    explanation?: string;
    order: number;
}

interface QuizBuilderProps {
    quiz: {
        id?: string;
        title: string;
        questions: QuizQuestionData[];
    };
    onUpdate: (updatedQuestions: QuizQuestionData[]) => void;
    onImportCSV: () => void;
}

export function QuizBuilder({ quiz, onUpdate, onImportCSV }: QuizBuilderProps) {
    const questions = [...(quiz.questions || [])].sort((a, b) => a.order - b.order);

    const updateQuestion = (id: string, updates: Partial<QuizQuestionData>) => {
        const newList = quiz.questions.map(q =>
            q.id === id ? { ...q, ...updates } : q
        );
        onUpdate(newList);
    };

    const addQuestion = () => {
        const newQ: QuizQuestionData = {
            id: `new-q-${Date.now()}`,
            question: "Untitled Question",
            options: ["Option 1", "Option 2"],
            correctAnswers: ["Option 1"],
            order: quiz.questions.length
        };
        onUpdate([...quiz.questions, newQ]);
    };

    const deleteQuestion = (id: string) => {
        onUpdate(quiz.questions.filter(q => q.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-1">
                    <h4 className="font-bold text-lg">Quiz Questions</h4>
                    <p className="text-sm text-muted-foreground">Manage questions manually or import via CSV</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                        onClick={onImportCSV}
                    >
                        <FileSpreadsheet className="h-4 w-4" />
                        Import CSV
                    </Button>
                    <Button variant="default" size="sm" className="gap-2" onClick={addQuestion}>
                        <Plus className="h-4 w-4" />
                        Add Question
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                {questions.length === 0 && (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border-2 border-dashed">
                        <p className="text-muted-foreground italic">No questions yet. Use "Add Question" or "Import CSV" to start.</p>
                    </div>
                )}
                {questions.map((q, qIdx) => (
                    <div key={q.id} className="p-4 border-2 rounded-xl bg-background space-y-4 group relative">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteQuestion(q.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>

                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question {qIdx + 1}</Label>
                            <Input
                                value={q.question}
                                onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                                className="font-semibold"
                                placeholder="Enter your question here..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-xs font-bold">Options</Label>
                                {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="flex gap-2">
                                        <Input
                                            value={opt}
                                            onChange={(e) => {
                                                const newOpts = [...q.options];
                                                const oldVal = newOpts[optIdx];
                                                const newVal = e.target.value;
                                                newOpts[optIdx] = newVal;

                                                const newCorrect = q.correctAnswers.map(ca => ca === oldVal ? newVal : ca);
                                                updateQuestion(q.id, { options: newOpts, correctAnswers: newCorrect });
                                            }}
                                            className="text-sm h-8"
                                        />
                                        <Button
                                            variant={q.correctAnswers.includes(opt) ? "default" : "outline"}
                                            size="icon"
                                            className="h-8 w-8 shrink-0"
                                            onClick={() => {
                                                let newCorrect = [...q.correctAnswers];
                                                if (newCorrect.includes(opt)) {
                                                    newCorrect = newCorrect.filter(c => c !== opt);
                                                } else {
                                                    newCorrect.push(opt);
                                                }
                                                updateQuestion(q.id, { correctAnswers: newCorrect });
                                            }}
                                        >
                                            {q.correctAnswers.includes(opt) ? <Check className="h-4 w-4" /> : <div className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0 text-muted-foreground"
                                            onClick={() => {
                                                const newOpts = q.options.filter((_, i) => i !== optIdx);
                                                const valToRemove = q.options[optIdx];
                                                const newCorrect = q.correctAnswers.filter(ca => ca !== valToRemove);
                                                updateQuestion(q.id, { options: newOpts, correctAnswers: newCorrect });
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-xs h-8 border-dashed"
                                    onClick={() => {
                                        const newOpts = [...q.options, `Option ${q.options.length + 1}`];
                                        updateQuestion(q.id, { options: newOpts });
                                    }}
                                >
                                    <Plus className="h-3 w-3 mr-2" /> Add Option
                                </Button>
                            </div>
                            <div className="space-y-3">
                                <Label className="text-xs font-bold">Explanation (Optional)</Label>
                                <Textarea
                                    value={q.explanation || ''}
                                    onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
                                    className="text-sm min-h-[100px]"
                                    placeholder="Why is this answer correct?"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
