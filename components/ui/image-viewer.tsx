"use client";

import { X, ChevronLeft, ChevronRight, Download, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ImageViewerProps {
    images: { url: string }[];
    initialIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

export function ImageViewer({ images, initialIndex = 0, isOpen, onClose }: ImageViewerProps) {
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    if (!isOpen) return null;

    const currentImage = images[currentIndex];

    const nextImage = () => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    const handleDownload = async () => {
        try {
            setIsSaving(true);
            const response = await fetch('/api/drive/save-from-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: currentImage.url,
                    name: `image-${currentIndex + 1}.jpg`
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to save to Drive');
            }

            const data = await response.json();

            toast({
                title: 'Saved to Drive',
                description: 'File has been saved to your personal Drive.',
            });
        } catch (e) {
            console.error("Save to Drive failed", e);
            toast({
                title: 'Error',
                description: 'Failed to save file to Drive.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
            {/* Close Button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/10 z-50 rounded-full w-10 h-10"
                onClick={onClose}
            >
                <X className="w-6 h-6" />
            </Button>

            {/* Download Button */}
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-16 text-white hover:bg-white/10 z-50 rounded-full w-10 h-10"
                onClick={handleDownload}
                disabled={isSaving}
            >
                {isSaving ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                    <Download className="w-6 h-6" />
                )}
            </Button>

            {/* Navigation Arrows */}
            {images.length > 1 && (
                <>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 text-white hover:bg-white/10 z-50 rounded-full w-12 h-12"
                        onClick={prevImage}
                    >
                        <ChevronLeft className="w-8 h-8" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 text-white hover:bg-white/10 z-50 rounded-full w-12 h-12"
                        onClick={nextImage}
                    >
                        <ChevronRight className="w-8 h-8" />
                    </Button>
                </>
            )}

            {/* Main Image */}
            <div className="relative w-full h-full p-4 md:p-12 flex items-center justify-center">
                <img
                    src={currentImage.url}
                    alt={`View ${currentIndex + 1}`}
                    className="max-h-full max-w-full object-contain shadow-2xl rounded-sm"
                />
            </div>

            {/* Counter */}
            {images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 bg-black/50 px-3 py-1 rounded-full text-sm">
                    {currentIndex + 1} / {images.length}
                </div>
            )}
        </div>
    );
}
