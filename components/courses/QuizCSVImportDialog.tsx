"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { parseQuizCSV, type ParsedQuizQuestion } from "@/lib/utils/quiz-parser";
import { Loader2, CheckCircle2, AlertTriangle, Info, FileSpreadsheet, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const AI_PROMPT = `Act as an expert educational content creator. I have a list of questions, answers, and explanations. Please convert them into a CSV format following these EXACT rules:

1. **Columns**: Header must be exactly: Question,Options,Correct Answers,Explanation
2. **Options**: Multiple options must be separated by a pipe (|). Example: Option 1|Option 2|Option 3
3. **Correct Answers**: Provide the exact text of the correct option(s). If multiple, separate by a pipe (|).
4. **Quoting**: If any text contains a comma, wrap the entire field in double quotes (").
5. **No Extra Text**: Provide ONLY the CSV block, no preamble or explanation.

**Here is the content to convert:**

[PASTE YOUR QUESTIONS/ANSWERS HERE]`;

interface QuizCSVImportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (questions: ParsedQuizQuestion[]) => void;
}

export function QuizCSVImportDialog({
    open,
    onOpenChange,
    onImport,
}: QuizCSVImportDialogProps) {
    const [csvText, setCsvText] = useState("");
    const [parseResult, setParseResult] = useState<ReturnType<typeof parseQuizCSV> | null>(null);
    const [isPromptCopied, setIsPromptCopied] = useState(false);

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(AI_PROMPT);
        setIsPromptCopied(true);
        setTimeout(() => setIsPromptCopied(false), 2000);
    };

    const handleParse = () => {
        if (!csvText.trim()) {
            setParseResult({
                success: false,
                questions: [],
                errors: ["Please paste CSV text"],
                warnings: [],
            });
            return;
        }

        const result = parseQuizCSV(csvText);
        setParseResult(result);
    };

    const handleImport = () => {
        if (!parseResult || !parseResult.success || parseResult.questions.length === 0) {
            return;
        }

        onImport(parseResult.questions);
        // Reset and close
        setCsvText("");
        setParseResult(null);
        onOpenChange(false);
    };

    const handleClose = () => {
        setCsvText("");
        setParseResult(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-green-600" />
                        Import Quiz Questions
                    </DialogTitle>
                    <DialogDescription>
                        Paste the CSV text from the AI generator to bulk add questions
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="w-full">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1 text-sm">
                                    <p className="font-semibold">Format Requirements:</p>
                                    <ul className="list-disc ml-4 space-y-1 text-muted-foreground">
                                        <li>Headers: <code className="text-primary font-bold">Question,Options,Correct Answers,Explanation</code></li>
                                        <li>Separate multiple options and correct answers using a pipe (<code className="font-bold">|</code>)</li>
                                        <li>Ensure correct answers exactly match one of the options</li>
                                    </ul>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className={cn(
                                        "gap-2 transition-all duration-300",
                                        isPromptCopied ? "border-green-500 text-green-600 bg-green-50" : "border-primary/20 hover:border-primary/50"
                                    )}
                                    onClick={handleCopyPrompt}
                                >
                                    {isPromptCopied ? (
                                        <>
                                            <Check className="h-4 w-4" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4 text-amber-500" />
                                            Copy AI Prompt
                                        </>
                                    )}
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <label className="text-sm font-bold">CSV Payload</label>
                        <Textarea
                            placeholder="Question,Options,Correct Answers,Explanation\n'What is React?',Library|Framework|DB,Library,UI Library"
                            value={csvText}
                            onChange={(e) => {
                                setCsvText(e.target.value);
                                if (parseResult) setParseResult(null);
                            }}
                            className="font-mono text-xs min-h-[150px] bg-slate-50 border-2"
                        />
                    </div>

                    {!parseResult && csvText && (
                        <Button onClick={handleParse} variant="secondary" className="w-full">
                            Validate Sequence
                        </Button>
                    )}

                    {parseResult && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            {parseResult.success && parseResult.questions.length > 0 && (
                                <Alert className="border-green-500 bg-green-50/50">
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    <AlertDescription className="text-green-800">
                                        <strong>Ready: {parseResult.questions.length} questions identified</strong>
                                        <div className="mt-3 space-y-2">
                                            {parseResult.questions.slice(0, 2).map((q, idx) => (
                                                <div key={idx} className="bg-white p-2 rounded border text-xs">
                                                    <p className="font-bold">Q: {q.question}</p>
                                                    <p className="text-muted-foreground">Opts: {q.options.join(', ')}</p>
                                                </div>
                                            ))}
                                            {parseResult.questions.length > 2 && (
                                                <p className="text-xs text-center text-muted-foreground italic">
                                                    + {parseResult.questions.length - 2} more...
                                                </p>
                                            )}
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {parseResult.errors.length > 0 && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        <p className="font-bold mb-1">Fix required:</p>
                                        <ul className="text-xs space-y-1 list-disc ml-4">
                                            {parseResult.errors.map((err, i) => <li key={i}>{err}</li>)}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}

                            {parseResult.warnings.length > 0 && (
                                <Alert className="border-yellow-500 bg-yellow-50">
                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    <AlertDescription className="text-yellow-800 text-xs">
                                        <p className="font-bold mb-1">Warnings (will proceed):</p>
                                        <ul className="space-y-1 list-disc ml-4">
                                            {parseResult.warnings.map((w, i) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-4 border-t">
                    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
                    <Button
                        onClick={handleImport}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={!parseResult?.success || parseResult.questions.length === 0}
                    >
                        Import Questions
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
