"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useUploadThing } from "@/lib/uploadthing"
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  SkipForward,
  SkipBack,
  Timer,
  Clock,
  Palette,
  Image,
  Youtube,
  Music,
  Upload,
  Trash2
} from "lucide-react"

interface Subject {
  id: string
  name: string
  color: string
}

interface TimerPreset {
  id: string
  name: string
  workDuration: number // in minutes
  breakDuration: number // in minutes
  longBreakDuration: number // in minutes
  sessionsUntilLongBreak: number
}

interface BackgroundImage {
  id: string
  url: string
  name: string
  category: string
}

interface ClockStyle {
  id: string
  name: string
  component: string
}

interface AdvancedStudyTimerProps {
  subjects: Subject[]
  onSessionComplete: (session: any) => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const TIMER_PRESETS: TimerPreset[] = [
  {
    id: "pomodoro",
    name: "Pomodoro (25/5)",
    workDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4
  },
  {
    id: "pomodoro-50",
    name: "Extended (50/10)",
    workDuration: 50,
    breakDuration: 10,
    longBreakDuration: 20,
    sessionsUntilLongBreak: 4
  },
  {
    id: "custom",
    name: "Custom",
    workDuration: 30,
    breakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4
  }
]

const BACKGROUND_IMAGES: BackgroundImage[] = [
  {
    id: "cafe",
    url: "linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #F4A460 100%)",
    name: "Cozy Cafe",
    category: "Study Spaces"
  },
  {
    id: "library",
    url: "linear-gradient(135deg, #4A5568 0%, #718096 50%, #A0AEC0 100%)",
    name: "Library",
    category: "Study Spaces"
  },
  {
    id: "nature",
    url: "linear-gradient(135deg, #228B22 0%, #32CD32 50%, #90EE90 100%)",
    name: "Forest",
    category: "Nature"
  },
  {
    id: "ocean",
    url: "linear-gradient(135deg, #1E90FF 0%, #4169E1 50%, #87CEEB 100%)",
    name: "Ocean",
    category: "Nature"
  },
  {
    id: "minimalist",
    url: "linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 50%, #E9ECEF 100%)",
    name: "Minimalist",
    category: "Abstract"
  },
  {
    id: "sunset",
    url: "linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD23F 100%)",
    name: "Sunset",
    category: "Nature"
  },
  {
    id: "night",
    url: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    name: "Night Sky",
    category: "Nature"
  },
  {
    id: "sakura",
    url: "linear-gradient(135deg, #FFB3BA 0%, #FFDFBA 50%, #FFFFBA 100%)",
    name: "Sakura",
    category: "Nature"
  }
]

const CLOCK_STYLES: ClockStyle[] = [
  { id: "digital", name: "Digital", component: "digital" },
  { id: "analog", name: "Analog", component: "analog" },
  { id: "minimal", name: "Minimal", component: "minimal" },
  { id: "modern", name: "Modern", component: "modern" }
]

export function AdvancedStudyTimer({
  subjects,
  onSessionComplete,
  isOpen: externalIsOpen,
  onOpenChange
}: AdvancedStudyTimerProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open)
    } else {
      setInternalIsOpen(open)
    }
  }

  // Timer State
  const [currentPreset, setCurrentPreset] = useState<TimerPreset>(TIMER_PRESETS[0])
  const [isRunning, setIsRunning] = useState(false)
  const [isWorkSession, setIsWorkSession] = useState(true)
  const [currentSession, setCurrentSession] = useState(1)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // seconds
  const [totalSessions, setTotalSessions] = useState(0)
  const [selectedSubject, setSelectedSubject] = useState("")
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [sessionNotes, setSessionNotes] = useState("")

  // Background & Style State
  const [selectedBackground, setSelectedBackground] = useState<BackgroundImage | null>(null)
  const [backgroundOpacity, setBackgroundOpacity] = useState(0.7)
  const [selectedClockStyle, setSelectedClockStyle] = useState<ClockStyle>(CLOCK_STYLES[0])
  const [clockColor, setClockColor] = useState("#ffffff")
  const [showProgress, setShowProgress] = useState(true)
  const [customBackgrounds, setCustomBackgrounds] = useState<BackgroundImage[]>([])

  // UploadThing hook for background images
  const { startUpload, isUploading } = useUploadThing("backgroundImageUploader", {
    onClientUploadComplete: (res) => {
      console.log("Upload completed:", res)
      const newBackgrounds = res.map((file, index) => ({
        id: `custom-${Date.now()}-${index}`,
        url: file.url,
        name: `Custom Background ${customBackgrounds.length + index + 1}`,
        category: "Custom"
      }))
      setCustomBackgrounds(prev => [...prev, ...newBackgrounds])
    },
    onUploadError: (error) => {
      console.error("Upload error:", error)
    }
  })

  // YouTube Integration State
  const [youtubePlaylist, setYoutubePlaylist] = useState("")
  const [isMusicEnabled, setIsMusicEnabled] = useState(false)
  const [musicVolume, setMusicVolume] = useState(30)
  const [isMuted, setIsMuted] = useState(false)
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [playlistVideos, setPlaylistVideos] = useState<string[]>([])
  const [playerError, setPlayerError] = useState<string | null>(null)

  // Settings State
  const [autoStartBreaks, setAutoStartBreaks] = useState(false)
  const [autoStartWork, setAutoStartWork] = useState(false)
  const [showNotifications, setShowNotifications] = useState(true)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize timer with preset
  useEffect(() => {
    const initialTime = isWorkSession ? currentPreset.workDuration * 60 : currentPreset.breakDuration * 60
    setTimeLeft(initialTime)
  }, [currentPreset, isWorkSession])

  // Load YouTube IFrame API
  useEffect(() => {
    if (isMusicEnabled && !window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

      // Make YT available globally
      ;(window as any).onYouTubeIframeAPIReady = () => {
        console.log('YouTube IFrame API loaded')
      }
    }
  }, [isMusicEnabled])

  // Initialize YouTube player when playlist URL changes
  useEffect(() => {
    if (isMusicEnabled && youtubePlaylist && window.YT && window.YT.Player) {
      initializeYouTubePlayer()
    }
  }, [isMusicEnabled, youtubePlaylist])

  // Update player volume when volume changes
  useEffect(() => {
    if (youtubePlayer && isPlayerReady) {
      const actualVolume = isMuted ? 0 : musicVolume
      youtubePlayer.setVolume(actualVolume)
    }
  }, [musicVolume, isMuted, youtubePlayer, isPlayerReady])

  // YouTube Player Functions
  const initializeYouTubePlayer = () => {
    try {
      setPlayerError(null)

      // Extract video or playlist ID from URL
      const videoId = extractVideoId(youtubePlaylist)
      const playlistId = extractPlaylistId(youtubePlaylist)

      if (!videoId && !playlistId) {
        setPlayerError("Invalid YouTube URL. Please provide a valid video or playlist URL.")
        return
      }

      // Destroy existing player
      if (youtubePlayer) {
        youtubePlayer.destroy()
      }

      // Create player configuration
      const playerVars: any = {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        showinfo: 0
      }

      // If it's a playlist, add playlist parameters
      if (playlistId) {
        playerVars.listType = 'playlist'
        playerVars.list = playlistId
      } else if (videoId) {
        // For single videos, just set the video ID
        playerVars.videoId = videoId
      }

      // Create new player
      const player = new (window as any).YT.Player('youtube-player', {
        height: '0',
        width: '0',
        playerVars,
        events: {
          onReady: (event: any) => {
            console.log('YouTube player ready')
            setIsPlayerReady(true)
            setYoutubePlayer(event.target)
            event.target.setVolume(isMuted ? 0 : musicVolume)
          },
          onStateChange: (event: any) => {
            // Handle player state changes if needed
            console.log('Player state changed:', event.data)
          },
          onError: (event: any) => {
            console.error('YouTube player error:', event.data)
            setPlayerError(`YouTube player error: ${event.data}`)
            setIsPlayerReady(false)
          }
        }
      })
    } catch (error) {
      console.error('Failed to initialize YouTube player:', error)
      setPlayerError('Failed to initialize YouTube player')
      setIsPlayerReady(false)
    }
  }

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^"&?\/\s]{11})/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }

  const extractPlaylistId = (url: string): string | null => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/.*[?&]list=)([^#\&\?]*)/,
      /(?:https?:\/\/)?(?:youtu\.be\/.*[?&]list=)([^#\&\?]*)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return null
  }

  const playMusic = () => {
    if (youtubePlayer && isPlayerReady) {
      youtubePlayer.playVideo()
    }
  }

  const pauseMusic = () => {
    if (youtubePlayer && isPlayerReady) {
      youtubePlayer.pauseVideo()
    }
  }

  const nextTrack = () => {
    if (youtubePlayer && isPlayerReady) {
      youtubePlayer.nextVideo()
    }
  }

  const previousTrack = () => {
    if (youtubePlayer && isPlayerReady) {
      youtubePlayer.previousVideo()
    }
  }

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          isRunning ? handlePause() : handleStart()
          break
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            handleReset()
          }
          break
        case 'Escape':
          if (isFullscreen) {
            setIsFullscreen(false)
          }
          break
        case 'F11':
          e.preventDefault()
          setIsFullscreen(!isFullscreen)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, isRunning, isFullscreen])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    const totalTime = isWorkSession ? currentPreset.workDuration * 60 : currentPreset.breakDuration * 60
    return ((totalTime - timeLeft) / totalTime) * 100
  }

  const handleStart = () => {
    if (!selectedSubject) return
    setIsRunning(true)
    if (!startTime) setStartTime(new Date())
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    const resetTime = isWorkSession ? currentPreset.workDuration * 60 : currentPreset.breakDuration * 60
    setTimeLeft(resetTime)
    setStartTime(null)
  }

  const handleSkip = () => {
    handleSessionComplete()
  }

  const handleSessionComplete = () => {
    setIsRunning(false)

    if (isWorkSession) {
      setTotalSessions(prev => prev + 1)
      // Check if it's time for a long break
      const shouldLongBreak = currentSession % currentPreset.sessionsUntilLongBreak === 0
      const breakTime = shouldLongBreak ? currentPreset.longBreakDuration * 60 : currentPreset.breakDuration * 60
      setTimeLeft(breakTime)
      setIsWorkSession(false)

      if (showNotifications) {
        new Notification("Work session complete! Time for a break.", {
          icon: "/favicon.ico"
        })
      }
    } else {
      // Break is over, start next work session
      setTimeLeft(currentPreset.workDuration * 60)
      setIsWorkSession(true)
      setCurrentSession(prev => prev + 1)

      if (showNotifications) {
        new Notification("Break time over! Ready to focus?", {
          icon: "/favicon.ico"
        })
      }
    }

    // Auto-start next session if enabled
    if ((isWorkSession && autoStartBreaks) || (!isWorkSession && autoStartWork)) {
      setTimeout(() => setIsRunning(true), 1000)
    }
  }

  const handleStop = () => {
    if (startTime && selectedSubject) {
      const endTime = new Date()
      const subject = subjects.find((s) => s.id === selectedSubject)

      if (subject) {
        const session = {
          subjectId: selectedSubject,
          subjectName: subject.name,
          date: startTime.toISOString().split("T")[0],
          startTime: startTime.toTimeString().slice(0, 5),
          endTime: endTime.toTimeString().slice(0, 5),
          duration: Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60)),
          topicsCovered: [],
          materialsUsed: [],
          sessionType: "Focused Study" as const,
          productivity: 3 as const,
          notes: sessionNotes.trim() || undefined,
        }

        onSessionComplete(session)
      }
    }

    // Reset everything
    setIsRunning(false)
    setTimeLeft(currentPreset.workDuration * 60)
    setIsWorkSession(true)
    setCurrentSession(1)
    setTotalSessions(0)
    setSelectedSubject("")
    setStartTime(null)
    setSessionNotes("")
    setIsFullscreen(false)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const renderClock = () => {
    const timeString = formatTime(timeLeft)

    switch (selectedClockStyle.id) {
      case "digital":
        return (
          <div className="text-center">
            <div
              className="text-8xl font-mono font-bold mb-4"
              style={{ color: clockColor }}
            >
              {timeString}
            </div>
            {showProgress && (
              <Progress value={getProgress()} className="w-64 mx-auto h-2" />
            )}
          </div>
        )

      case "analog":
        return (
          <div className="text-center">
            <div className="relative w-64 h-64 mx-auto mb-4">
              {/* Analog clock implementation would go here */}
              <div
                className="text-6xl font-mono font-bold absolute inset-0 flex items-center justify-center"
                style={{ color: clockColor }}
              >
                {timeString}
              </div>
            </div>
            {showProgress && (
              <Progress value={getProgress()} className="w-64 mx-auto h-2" />
            )}
          </div>
        )

      case "minimal":
        return (
          <div className="text-center">
            <div
              className="text-9xl font-light mb-4"
              style={{ color: clockColor }}
            >
              {timeString}
            </div>
          </div>
        )

      case "modern":
        return (
          <div className="text-center">
            <div className="relative">
              <div
                className="text-7xl font-bold mb-4 relative z-10"
                style={{ color: clockColor }}
              >
                {timeString}
              </div>
              <div className="absolute inset-0 text-7xl font-bold text-black/10 transform translate-x-1 translate-y-1">
                {timeString}
              </div>
            </div>
            {showProgress && (
              <div className="w-80 mx-auto">
                <Progress value={getProgress()} className="h-3" />
              </div>
            )}
          </div>
        )

      default:
        return (
          <div className="text-center">
            <div
              className="text-8xl font-mono font-bold mb-4"
              style={{ color: clockColor }}
            >
              {timeString}
            </div>
          </div>
        )
    }
  }

  const timerContent = (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Badge variant={isWorkSession ? "default" : "secondary"}>
            {isWorkSession ? "Focus Time" : "Break Time"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Session {currentSession}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="text-center">
        {renderClock()}
        <div className="text-sm text-muted-foreground mt-2">
          {isWorkSession ? "Time to focus!" : "Take a break"}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center space-x-3">
        {!isRunning ? (
          <Button onClick={handleStart} disabled={!selectedSubject} size="lg" className="px-8">
            <Play className="h-5 w-5 mr-2" />
            Start
          </Button>
        ) : (
          <Button onClick={handlePause} variant="outline" size="lg" className="px-8">
            <Pause className="h-5 w-5 mr-2" />
            Pause
          </Button>
        )}

        <Button onClick={handleReset} variant="outline" size="lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>

        <Button onClick={handleSkip} variant="outline" size="lg">
          <SkipForward className="h-4 w-4 mr-2" />
          Skip
        </Button>

        <Button onClick={handleStop} variant="destructive" size="lg">
          <Square className="h-4 w-4 mr-2" />
          Stop
        </Button>
      </div>

      {/* Session Notes */}
      {isRunning && (
        <div className="space-y-2">
          <Label>Session Notes</Label>
          <Input
            placeholder="What are you working on?"
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
          />
        </div>
      )}

      {/* Music Controls */}
      {isMusicEnabled && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Music className="h-4 w-4" />
                  <span className="text-sm font-medium">Background Music</span>
                  {playerError && (
                    <Badge variant="destructive" className="text-xs">
                      Error
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={previousTrack} disabled={!isPlayerReady}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsMuted(!isMuted)}>
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={nextTrack} disabled={!isPlayerReady}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                  <div className="w-20">
                    <Slider
                      value={[isMuted ? 0 : musicVolume]}
                      onValueChange={(value) => setMusicVolume(value[0])}
                      max={100}
                      step={1}
                    />
                  </div>
                </div>
              </div>

              {playerError && (
                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                  {playerError}
                </div>
              )}

              {!isPlayerReady && youtubePlaylist && (
                <div className="text-xs text-muted-foreground">
                  Loading YouTube player...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 bg-black"
        style={{
          background: selectedBackground ? selectedBackground.url : undefined
        }}
      >
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: selectedBackground ? backgroundOpacity : 1 }}
        />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-8">
          {timerContent}
          <div className="absolute bottom-4 left-4 text-white/50 text-xs">
            Press ESC or click minimize to exit fullscreen
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Hidden YouTube Player */}
      <div id="youtube-player" style={{ display: 'none' }}></div>

      <Button variant="outline" onClick={() => setIsOpen(true)}>
        <Timer className="h-4 w-4 mr-2" />
        Advanced Timer
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Advanced Study Timer</DialogTitle>
            <DialogDescription>
              Customizable Pomodoro timer with backgrounds, music, and more
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="timer" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="timer">
                <Timer className="h-4 w-4 mr-2" />
                Timer
              </TabsTrigger>
              <TabsTrigger value="background">
                <Image className="h-4 w-4 mr-2" />
                Background
              </TabsTrigger>
              <TabsTrigger value="style">
                <Palette className="h-4 w-4 mr-2" />
                Style
              </TabsTrigger>
              <TabsTrigger value="music">
                <Youtube className="h-4 w-4 mr-2" />
                Music
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timer" className="space-y-6">
              {/* Timer Preset Selection */}
              <div className="space-y-2">
                <Label>Timer Preset</Label>
                <Select
                  value={currentPreset.id}
                  onValueChange={(value) => {
                    const preset = TIMER_PRESETS.find(p => p.id === value)
                    if (preset) setCurrentPreset(preset)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMER_PRESETS.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subject Selection */}
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={isRunning}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject to study" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Timer Settings */}
              {currentPreset.id === "custom" && (
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Work Duration (min)</Label>
                        <Input
                          type="number"
                          value={currentPreset.workDuration}
                          onChange={(e) => setCurrentPreset(prev => ({
                            ...prev,
                            workDuration: parseInt(e.target.value) || 25
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Break Duration (min)</Label>
                        <Input
                          type="number"
                          value={currentPreset.breakDuration}
                          onChange={(e) => setCurrentPreset(prev => ({
                            ...prev,
                            breakDuration: parseInt(e.target.value) || 5
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Main Timer Display */}
              <Card>
                <CardContent className="p-8">
                  {timerContent}
                </CardContent>
              </Card>

              {/* Timer Statistics */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{totalSessions}</div>
                  <div className="text-sm text-muted-foreground">Sessions Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{currentSession}</div>
                  <div className="text-sm text-muted-foreground">Current Session</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {Math.floor((Date.now() - (startTime?.getTime() || Date.now())) / (1000 * 60))}
                  </div>
                  <div className="text-sm text-muted-foreground">Minutes Today</div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="background" className="space-y-6">
              <div className="space-y-4">
                {/* Upload Section */}
                <div>
                  <Label>Upload Custom Background</Label>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          try {
                            await startUpload([file])
                          } catch (error) {
                            console.error("Upload failed:", error)
                          }
                        }
                        // Reset the input so the same file can be selected again
                        e.target.value = ''
                      }}
                      disabled={isUploading}
                      className="hidden"
                      id="background-upload"
                    />
                    <label htmlFor="background-upload">
                      <Button
                        variant="outline"
                        className="w-full cursor-pointer"
                        disabled={isUploading}
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          {isUploading ? "Uploading..." : "Choose Image"}
                        </span>
                      </Button>
                    </label>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Max 8MB, supports JPG, PNG, GIF, WebP
                  </div>
                </div>

                {/* Default Backgrounds */}
                <div>
                  <Label>Default Backgrounds</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                    {BACKGROUND_IMAGES.map((bg) => (
                      <div
                        key={bg.id}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedBackground?.id === bg.id ? 'border-primary' : 'border-border'
                        }`}
                        onClick={() => setSelectedBackground(bg)}
                      >
                        <div
                          className="h-24 bg-cover bg-center"
                          style={{ background: bg.url }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
                          <div className="text-xs font-medium">{bg.name}</div>
                          <div className="text-xs opacity-75">{bg.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Backgrounds */}
                {customBackgrounds.length > 0 && (
                  <div>
                    <Label>Your Custom Backgrounds</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                      {customBackgrounds.map((bg) => (
                        <div
                          key={bg.id}
                          className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            selectedBackground?.id === bg.id ? 'border-primary' : 'border-border'
                          }`}
                          onClick={() => setSelectedBackground(bg)}
                        >
                          <div
                            className="h-24 bg-cover bg-center"
                            style={{ backgroundImage: `url(${bg.url})` }}
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2">
                            <div className="text-xs font-medium">{bg.name}</div>
                            <div className="text-xs opacity-75">{bg.category}</div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              setCustomBackgrounds(prev => prev.filter(b => b.id !== bg.id))
                              if (selectedBackground?.id === bg.id) {
                                setSelectedBackground(null)
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBackground && (
                  <div className="space-y-2">
                    <Label>Background Opacity</Label>
                    <Slider
                      value={[backgroundOpacity]}
                      onValueChange={(value) => setBackgroundOpacity(value[0])}
                      max={1}
                      min={0.1}
                      step={0.1}
                    />
                    <div className="text-xs text-muted-foreground">
                      {Math.round(backgroundOpacity * 100)}% opacity
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Clock Style</Label>
                  <Select
                    value={selectedClockStyle.id}
                    onValueChange={(value) => {
                      const style = CLOCK_STYLES.find(s => s.id === value)
                      if (style) setSelectedClockStyle(style)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLOCK_STYLES.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Clock Color</Label>
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="color"
                      value={clockColor}
                      onChange={(e) => setClockColor(e.target.value)}
                      className="w-10 h-10 rounded border"
                    />
                    <span className="text-sm text-muted-foreground">{clockColor}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-progress"
                    checked={showProgress}
                    onCheckedChange={setShowProgress}
                  />
                  <Label htmlFor="show-progress">Show Progress Bar</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="music" className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enable-music"
                    checked={isMusicEnabled}
                    onCheckedChange={setIsMusicEnabled}
                  />
                  <Label htmlFor="enable-music">Enable Background Music</Label>
                </div>

                {isMusicEnabled && (
                  <>
                    <div>
                      <Label>YouTube Video or Playlist URL</Label>
                      <Input
                        placeholder="https://www.youtube.com/watch?v=... or https://www.youtube.com/playlist?list=..."
                        value={youtubePlaylist}
                        onChange={(e) => setYoutubePlaylist(e.target.value)}
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Supports both single videos and playlists
                      </div>
                    </div>

                    <Card>
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Volume</Label>
                            <span className="text-sm text-muted-foreground">{musicVolume}%</span>
                          </div>
                          <Slider
                            value={[musicVolume]}
                            onValueChange={(value) => setMusicVolume(value[0])}
                            max={100}
                            step={1}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
