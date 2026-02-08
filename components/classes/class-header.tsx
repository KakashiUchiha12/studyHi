"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, Copy, Check } from "lucide-react"
import { Class, ClassRole } from "@/types/classes"
import { useState } from "react"
import { toast } from "sonner"

interface ClassHeaderProps {
  classData: Class
  userRole: ClassRole | null
  onUpdate: () => void
}

const COVER_COLORS = {
  '#3B82F6': 'bg-blue-500',
  '#10B981': 'bg-green-500',
  '#8B5CF6': 'bg-purple-500',
  '#EF4444': 'bg-red-500',
  '#F59E0B': 'bg-amber-500',
}

export function ClassHeader({ classData, userRole, onUpdate }: ClassHeaderProps) {
  const [copied, setCopied] = useState(false)
  
  const coverColorClass = COVER_COLORS[classData.coverImage as keyof typeof COVER_COLORS] || 'bg-blue-500'

  const handleCopyCode = () => {
    navigator.clipboard.writeText(classData.joinCode)
    setCopied(true)
    toast.success("Join code copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`${coverColorClass} text-white`}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">{classData.name}</h1>
            {classData.description && (
              <p className="text-lg opacity-90 max-w-2xl">{classData.description}</p>
            )}
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                {userRole?.toUpperCase()}
              </Badge>
              {(userRole === 'admin' || userRole === 'teacher') && (
                <div className="flex items-center gap-2">
                  <span className="text-sm opacity-80">Class Code:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyCode}
                    className="bg-white/10 hover:bg-white/20 text-white h-7 px-3"
                  >
                    <code className="font-mono font-bold mr-2">{classData.joinCode}</code>
                    {copied ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {userRole === 'admin' && (
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
