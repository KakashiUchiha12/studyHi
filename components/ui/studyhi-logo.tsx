"use client"

import { cn } from "@/lib/utils"

interface StudyHiLogoProps {
  size?: "sm" | "default" | "lg" | "xl"
  showTagline?: boolean
  animated?: boolean
  className?: string
}

export function StudyHiLogo({
  size = "default",
  showTagline = true,
  animated = true,
  className
}: StudyHiLogoProps) {
  const sizeClasses = {
    sm: "text-2xl",
    default: "text-4xl",
    lg: "text-5xl",
    xl: "text-6xl"
  }

  const taglineSizeClasses = {
    sm: "text-xs",
    default: "text-sm",
    lg: "text-base",
    xl: "text-lg"
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div
        className={cn(
          "font-['Helvetica Neue'] font-medium select-none",
          sizeClasses[size]
        )}
        style={{ letterSpacing: '2px' }}
      >
        <span className="text-foreground font-normal">Study</span>
        <span
          className={cn(
            "font-medium bg-gradient-to-r from-[#03001e] via-[#7303c0] via-[#ec38bc] to-[#fdeff9] bg-clip-text text-transparent",
            animated && "animate-gradient-move"
          )}
          style={{
            backgroundSize: animated ? '400% 400%' : '100% 100%',
            animation: animated ? 'gradientMove 10s ease-in-out infinite' : 'none'
          }}
        >
          Hi
        </span>
      </div>
      {showTagline && (
        <div
          className={cn(
            "text-muted-foreground font-['Helvetica Neue'] font-normal mt-2 select-none",
            taglineSizeClasses[size]
          )}
          style={{ letterSpacing: '0.5px' }}
        >
          Welcome to Learning
        </div>
      )}

      <style jsx>{`
        @keyframes gradientMove {
          0% {
            background-position: 10% 10%;
          }
          25% {
            background-position: 50% 50%;
          }
          50% {
            background-position: 90% 10%;
          }
          75% {
            background-position: 10% 90%;
          }
          100% {
            background-position: 50% 50%;
          }
        }

        .animate-gradient-move {
          animation: gradientMove 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// Compact version for headers/navigation
export function StudyHiLogoCompact({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div
        className="font-['Helvetica Neue'] font-medium text-2xl select-none animate-gradient-move"
        style={{
          letterSpacing: '1px',
          backgroundSize: '400% 400%',
          animation: 'gradientMove 10s ease-in-out infinite'
        }}
      >
        <span className="text-foreground font-normal">Study</span>
        <span
          className="font-medium bg-gradient-to-r from-[#03001e] via-[#7303c0] via-[#ec38bc] to-[#fdeff9] bg-clip-text text-transparent"
          style={{
            backgroundSize: '400% 400%',
            animation: 'gradientMove 10s ease-in-out infinite'
          }}
        >
          Hi
        </span>
      </div>
      <div
        className="text-muted-foreground font-['Helvetica Neue'] font-normal text-xs mt-1 select-none"
        style={{ letterSpacing: '0.5px' }}
      >
        Welcome to Learning
      </div>

      <style jsx>{`
        @keyframes gradientMove {
          0% {
            background-position: 10% 10%;
          }
          25% {
            background-position: 50% 50%;
          }
          50% {
            background-position: 90% 10%;
          }
          75% {
            background-position: 10% 90%;
          }
          100% {
            background-position: 50% 50%;
          }
        }

        .animate-gradient-move {
          animation: gradientMove 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// Icon-only version for favicons or small spaces
export function StudyHiIcon({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn("flex items-center justify-center rounded-full bg-gradient-to-r from-[#03001e] via-[#7303c0] via-[#ec38bc] to-[#fdeff9] text-white font-bold select-none", className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        fontFamily: 'Helvetica Neue, Arial, sans-serif'
      }}
    >
      H
    </div>
  )
}
