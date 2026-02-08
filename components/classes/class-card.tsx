"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, FileText, BookOpen } from "lucide-react"
import { Class } from "@/types/classes"

interface ClassCardProps {
  classData: Class
}

const COVER_COLORS = {
  '#3B82F6': 'bg-blue-500',
  '#10B981': 'bg-green-500',
  '#8B5CF6': 'bg-purple-500',
  '#EF4444': 'bg-red-500',
  '#F59E0B': 'bg-amber-500',
}

const ROLE_COLORS = {
  admin: 'bg-red-500 text-white',
  teacher: 'bg-blue-500 text-white',
  student: 'bg-green-500 text-white',
}

export function ClassCard({ classData }: ClassCardProps) {
  const router = useRouter()
  
  const coverColorClass = COVER_COLORS[classData.coverImage as keyof typeof COVER_COLORS] || 'bg-blue-500'
  const roleColor = ROLE_COLORS[classData.role as keyof typeof ROLE_COLORS] || ROLE_COLORS.student

  const handleClick = () => {
    router.push(`/classes/${classData.id}`)
  }

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
      onClick={handleClick}
    >
      <div className={`h-24 ${coverColorClass} relative`}>
        {classData.coverImage && classData.coverImage.startsWith('http') ? (
          <img 
            src={classData.coverImage} 
            alt={classData.name}
            className="w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute top-2 right-2">
          <Badge className={roleColor}>
            {classData.role?.toUpperCase()}
          </Badge>
        </div>
      </div>
      
      <CardHeader>
        <CardTitle className="text-xl group-hover:text-primary transition-colors">
          {classData.name}
        </CardTitle>
        {classData.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {classData.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-muted-foreground">
              <Users className="h-4 w-4 mr-2" />
              <span>{classData.memberCount || classData._count?.members || 0} members</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <FileText className="h-4 w-4 mr-2" />
              <span>{classData.assignmentCount || classData._count?.assignments || 0} assignments</span>
            </div>
          </div>

          {classData.creator && (
            <div className="flex items-center space-x-2 pt-2 border-t">
              <Avatar className="h-6 w-6">
                <AvatarImage src={classData.creator.image || undefined} />
                <AvatarFallback>
                  {classData.creator.name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                {classData.creator.name || classData.creator.email}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
