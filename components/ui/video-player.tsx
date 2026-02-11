"use client";

import { cn } from "@/lib/utils";
import { Play } from "lucide-react";
import { useState, useRef } from "react";

interface VideoPlayerProps {
    src: string;
    poster?: string;
    className?: string;
    autoPlay?: boolean;
    muted?: boolean;
}

export function VideoPlayer({
    src,
    poster,
    className,
    autoPlay = false,
    muted = false
}: VideoPlayerProps) {
    const [isStarted, setIsStarted] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handlePlay = () => {
        if (videoRef.current) {
            videoRef.current.play();
            setIsStarted(true);
        }
    };

    return (
        <div className={cn("relative group bg-black rounded-lg overflow-hidden", className)}>
            {!isStarted && !autoPlay && (
                <div
                    className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer group-hover:bg-black/20 transition-colors"
                    onClick={handlePlay}
                >
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 shadow-xl group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-white fill-current translate-x-0.5" />
                    </div>
                </div>
            )}
            <video
                ref={videoRef}
                src={src}
                poster={poster}
                controls={isStarted || autoPlay}
                autoPlay={autoPlay}
                muted={muted}
                className="w-full h-full max-h-[500px] object-contain"
                onPlay={() => setIsStarted(true)}
            />
        </div>
    );
}
