"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, UserMinus, Shield, GraduationCap, User } from "lucide-react"
import { ClassMember, ClassRole } from "@/types/classes"

interface MemberCardProps {
  member: ClassMember
  isAdmin: boolean
  onRemove: (userId: string) => void
  onChangeRole: (userId: string, newRole: ClassRole) => void
}

const ROLE_COLORS = {
  admin: 'bg-red-500 text-white',
  teacher: 'bg-blue-500 text-white',
  student: 'bg-green-500 text-white',
}

const ROLE_ICONS = {
  admin: Shield,
  teacher: GraduationCap,
  student: User,
}

export function MemberCard({ member, isAdmin, onRemove, onChangeRole }: MemberCardProps) {
  const RoleIcon = ROLE_ICONS[member.role as keyof typeof ROLE_ICONS]
  const roleColor = ROLE_COLORS[member.role as keyof typeof ROLE_COLORS]

  return (
    <div className="flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center space-x-3">
        <Link
          href={`/profile/${member.userId}`}
          className="flex items-center space-x-3 group"
        >
          <Avatar className="h-10 w-10 transition-opacity group-hover:opacity-80">
            <AvatarImage src={member.user?.image || undefined} />
            <AvatarFallback>
              {member.user?.name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium group-hover:text-primary transition-colors truncate">
              {member.user?.name || 'Unknown'}
            </p>
            <p className="text-sm text-muted-foreground truncate">{member.user?.email}</p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <Badge className={roleColor}>
          <RoleIcon className="h-3 w-3 mr-1" />
          {member.role.toUpperCase()}
        </Badge>

        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {member.role !== 'teacher' && (
                <DropdownMenuItem onClick={() => onChangeRole(member.userId, 'teacher')}>
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Make Teacher
                </DropdownMenuItem>
              )}
              {member.role !== 'student' && (
                <DropdownMenuItem onClick={() => onChangeRole(member.userId, 'student')}>
                  <User className="h-4 w-4 mr-2" />
                  Make Student
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onChangeRole(member.userId, 'admin')}>
                <Shield className="h-4 w-4 mr-2" />
                Make Admin
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onRemove(member.userId)}
                className="text-destructive"
              >
                <UserMinus className="h-4 w-4 mr-2" />
                Remove Member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
