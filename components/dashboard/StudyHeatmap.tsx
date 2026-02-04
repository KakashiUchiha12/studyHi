"use client"

import React, { useMemo, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, addYears, subYears, isSameDay } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface StudySession {
  id: string
  startTime: Date | string
  durationMinutes: number
}

interface StudyHeatmapProps {
  studySessions: StudySession[]
}

export function StudyHeatmap({ studySessions }: StudyHeatmapProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const dailyData = useMemo(() => {
    const data: { [key: number]: number } = {}
    const month = currentDate.getMonth()
    const year = currentDate.getFullYear()

    studySessions.forEach(session => {
      const startTime = new Date(session.startTime)
      // Filter for current month and year
      if (startTime.getMonth() === month && startTime.getFullYear() === year) {
        const day = startTime.getDate()
        const hours = session.durationMinutes / 60
        data[day] = (data[day] || 0) + hours
      }
    })

    return data
  }, [studySessions, currentDate])

  const days = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = endOfMonth(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Find max hours to determine color scale intensity
  const maxHours = Math.max(...Object.values(dailyData), 0)

  // Function to get color based on intensity
  const getColor = (hours: number) => {
    if (hours === 0) return "bg-muted/20"

    // GitHub-like green scale
    if (maxHours === 0) return "bg-muted/20"

    const intensity = hours / (maxHours || 1) // Avoid division by zero

    if (intensity > 0.8) return "bg-green-700"
    if (intensity > 0.6) return "bg-green-600"
    if (intensity > 0.4) return "bg-green-500"
    if (intensity > 0.2) return "bg-green-400"
    return "bg-green-300"
  }

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))
  const nextYear = () => setCurrentDate(addYears(currentDate, 1))
  const prevYear = () => setCurrentDate(subYears(currentDate, 1))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-foreground">Study Hours</h4>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prevYear} title="Previous Year">
            <ChevronsLeft className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prevMonth} title="Previous Month">
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span className="text-xs font-medium w-24 text-center">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={nextMonth} title="Next Month">
            <ChevronRight className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={nextYear} title="Next Year">
            <ChevronsRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="bg-muted/20 rounded-lg p-4">
        <div className="flex flex-col gap-2">
          {/* Days Grid */}
          <div className="flex flex-wrap gap-1">
            {days.map((date, i) => {
              const day = date.getDate()
              const hours = dailyData[day] || 0

              return (
                <TooltipProvider key={i}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "w-3 h-3 sm:w-4 sm:h-4 rounded-sm transition-colors cursor-pointer border border-transparent hover:border-border",
                          getColor(hours)
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <div className="text-xs">
                        <span className="font-semibold">{format(date, "MMM d")}</span>: {hours.toFixed(1)} hrs
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-muted/20" />
              <div className="w-3 h-3 rounded-sm bg-green-300" />
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <div className="w-3 h-3 rounded-sm bg-green-700" />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  )
}
