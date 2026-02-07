"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell, Check, X, ExternalLink, MessageSquare, Heart, MessageCircle, UserCircle } from "lucide-react"
import { notificationManager, type StudyNotification } from "@/lib/notifications"
import { format } from "date-fns"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<StudyNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const { data: session } = useSession()
  const userId = (session?.user as any)?.id

  useEffect(() => {
    // Pass userId to subscribe to setup Pusher if needed
    const unsubscribe = notificationManager.subscribe(setNotifications, userId)
    return unsubscribe
  }, [userId])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    notificationManager.markAsRead(id)
  }

  const handleMarkAllAsRead = () => {
    notificationManager.markAllAsRead()
  }

  const handleRemove = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    notificationManager.removeNotification(id)
  }

  const getNotificationIcon = (type: StudyNotification["type"]) => {
    switch (type) {
      case "message": return <MessageSquare className="h-4 w-4 text-blue-500" />
      case "channel_message": return <MessageSquare className="h-4 w-4 text-indigo-500" />
      case "like": return <Heart className="h-4 w-4 text-red-500 fill-red-500" />
      case "comment": return <MessageCircle className="h-4 w-4 text-green-500" />
      case "follow": return <UserCircle className="h-4 w-4 text-purple-500" />
      case "reminder": return "⏰"
      case "achievement": return "🎉"
      case "deadline": return "⚠️"
      case "goal": return "🎯"
      default: return "📚"
    }
  }

  const getNotificationColor = (type: StudyNotification["type"]) => {
    switch (type) {
      case "message":
      case "channel_message": return "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20"
      case "like": return "border-red-200 bg-red-50/50 dark:bg-red-950/20"
      case "comment": return "border-green-200 bg-green-50/50 dark:bg-green-950/20"
      case "follow": return "border-purple-200 bg-purple-50/50 dark:bg-purple-950/20"
      case "reminder": return "border-blue-200 bg-blue-50 dark:bg-blue-950/20"
      case "achievement": return "border-green-200 bg-green-50 dark:bg-green-950/20"
      case "deadline": return "border-red-200 bg-red-50 dark:bg-red-950/20"
      case "goal": return "border-purple-200 bg-purple-50 dark:bg-purple-950/20"
      default: return "border-gray-200 bg-gray-50 dark:bg-gray-950/20"
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold border-2 border-background"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 sm:w-96 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3 px-4 pt-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs h-7 px-2 hover:bg-muted"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <ScrollArea className="h-[450px]">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Bell className="h-6 w-6 opacity-50" />
                  </div>
                  <p className="text-sm">Stay updated with your study social circle!</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => {
                        if (notification.actionUrl) {
                          notificationManager.markAsRead(notification.id)
                          setIsOpen(false)
                        }
                      }}
                      className={cn(
                        "p-4 transition-colors hover:bg-muted/50 relative cursor-pointer group",
                        !notification.read ? "bg-muted/20" : "bg-transparent opacity-80"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {notification.sender ? (
                          <Avatar className="h-10 w-10 border border-background">
                            <AvatarImage src={notification.sender.image || ""} alt={notification.sender.name} />
                            <AvatarFallback className="text-xs">{notification.sender.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">
                            {typeof getNotificationIcon(notification.type) === 'string'
                              ? getNotificationIcon(notification.type)
                              : <Bell className="h-4 w-4" />}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h4 className={cn("text-sm font-semibold truncate", !notification.read ? "text-foreground" : "text-muted-foreground")}>
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {format(notification.timestamp, "HH:mm")}
                            </span>
                          </div>
                          <p className={cn("text-sm line-clamp-2", !notification.read ? "text-foreground/90" : "text-muted-foreground")}>
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1 rounded-md bg-muted/80">
                                {getNotificationIcon(notification.type)}
                              </div>
                              {notification.actionUrl && (
                                <Link href={notification.actionUrl} className="text-[11px] font-medium text-primary hover:underline">
                                  View details
                                </Link>
                              )}
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => handleMarkAsRead(notification.id, e)}
                                  className="h-7 w-7 rounded-full"
                                  title="Mark as read"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => handleRemove(notification.id, e)}
                                className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive"
                                title="Remove"
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {notifications.length > 0 && (
              <div className="p-2 border-t text-center">
                <Button variant="ghost" className="w-full text-xs text-muted-foreground h-8" asChild onClick={() => setIsOpen(false)}>
                  <Link href="/notifications">View all notifications</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}

