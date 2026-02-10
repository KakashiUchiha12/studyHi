import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { X, Upload, Folder, Search, Settings, HelpCircle } from "lucide-react"

interface OnboardingStep {
    title: string
    description: string
    icon: React.ReactNode
    action?: {
        label: string
        onClick: () => void
    }
}

/**
 * Onboarding guide for new users
 */
export function DriveOnboarding({ onComplete }: { onComplete: () => void }) {
    const [currentStep, setCurrentStep] = useState(0)
    const [dismissed, setDismissed] = useState(false)

    const steps: OnboardingStep[] = [
        {
            title: "Welcome to Drive!",
            description: "Store and organize all your study materials in one secure place. Let's get you started.",
            icon: <HelpCircle className="h-8 w-8 text-primary" />,
        },
        {
            title: "Upload Files",
            description: "Click the upload button or drag and drop files anywhere. All file types supported up to 500MB.",
            icon: <Upload className="h-8 w-8 text-primary" />,
        },
        {
            title: "Create Folders",
            description: "Organize your files into folders. Your subject files automatically appear in dedicated folders.",
            icon: <Folder className="h-8 w-8 text-primary" />,
        },
        {
            title: "Search & Filter",
            description: "Quickly find files using search, filters, and tags. Sort by name, date, or size.",
            icon: <Search className="h-8 w-8 text-primary" />,
        },
        {
            title: "Manage Storage",
            description: "Monitor your storage usage and delete files you don't need. Items in trash auto-delete after 30 days.",
            icon: <Settings className="h-8 w-8 text-primary" />,
        },
    ]

    const currentStepData = steps[currentStep]

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            onComplete()
        }
    }

    const handleSkip = () => {
        setDismissed(true)
        onComplete()
    }

    if (dismissed) return null

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-6 space-y-6">
                {/* Progress indicator */}
                <div className="flex gap-1">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1 flex-1 rounded-full transition-colors ${index <= currentStep ? 'bg-primary' : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>

                {/* Close button */}
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="absolute top-4 right-4"
                >
                    <X className="h-4 w-4" />
                </Button>

                {/* Content */}
                <div className="text-center space-y-4">
                    <div className="flex justify-center">
                        {currentStepData.icon}
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-xl font-semibold">
                            {currentStepData.title}
                        </h3>
                        <p className="text-muted-foreground">
                            {currentStepData.description}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {currentStep > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="flex-1"
                        >
                            Previous
                        </Button>
                    )}
                    <Button
                        onClick={handleNext}
                        className="flex-1"
                    >
                        {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
                    </Button>
                </div>

                {/* Skip option */}
                <button
                    onClick={handleSkip}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-center"
                >
                    Skip tutorial
                </button>
            </Card>
        </div>
    )
}

/**
 * Quick tips that can be shown contextually
 */
export function QuickTip({ tip, onDismiss }: { tip: string; onDismiss: () => void }) {
    return (
        <Card className="p-3 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm flex-1">{tip}</p>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                    className="h-6 w-6 p-0 flex-shrink-0"
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>
        </Card>
    )
}

/**
 * Tips for different contexts
 */
export const driveTips = {
    firstUpload: "Tip: You can drag and drop multiple files at once!",
    firstFolder: "Tip: Subject folders are created automatically from your classes.",
    searchEmpty: "Tip: Use tags to make files easier to find later.",
    storageLow: "Tip: Delete files you don't need or move them to trash to free up space.",
    bandwidthLow: "Tip: Your bandwidth resets daily at midnight UTC.",
}
