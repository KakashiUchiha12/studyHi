"use client"

import { toast } from "react-hot-toast"
import { isPast, isToday } from "date-fns"

export interface StudyNotification {
  id: string
  type: "reminder" | "achievement" | "deadline" | "goal"
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

class NotificationManager {
  private notifications: StudyNotification[] = []
  private subscribers: ((notifications: StudyNotification[]) => void)[] = []

  constructor() {
    if (typeof window !== "undefined") {
      this.loadNotifications()
      this.requestPermission()
    }
  }

  private loadNotifications() {
    const saved = localStorage.getItem("studyNotifications")
    if (saved) {
      this.notifications = JSON.parse(saved).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }))
    }
  }

  private saveNotifications() {
    localStorage.setItem("studyNotifications", JSON.stringify(this.notifications))
    this.notifySubscribers()
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback([...this.notifications]))
  }

  subscribe(callback: (notifications: StudyNotification[]) => void) {
    this.subscribers.push(callback)
    callback([...this.notifications])
    
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback)
    }
  }

  async requestPermission() {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission()
    }
  }

  addNotification(notification: Omit<StudyNotification, "id" | "timestamp" | "read">) {
    const newNotification: StudyNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    }

    this.notifications.unshift(newNotification)
    this.saveNotifications()

    // Show toast notification
    toast(notification.message, {
      duration: 5000,
      icon: this.getNotificationIcon(notification.type)
    })

    // Show browser notification if permission granted
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/placeholder-logo.png"
      })
    }
  }

  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id)
    if (notification) {
      notification.read = true
      this.saveNotifications()
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true)
    this.saveNotifications()
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id)
    this.saveNotifications()
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length
  }

  private getNotificationIcon(type: StudyNotification["type"]): string {
    switch (type) {
      case "reminder": return "⏰"
      case "achievement": return "🎉"
      case "deadline": return "⚠️"
      case "goal": return "🎯"
      default: return "📚"
    }
  }

  // Study-specific notification methods
  scheduleStudyReminder(subject: string, time: Date) {
    const now = new Date()
    const timeUntilReminder = time.getTime() - now.getTime()

    if (timeUntilReminder > 0) {
      setTimeout(() => {
        this.addNotification({
          type: "reminder",
          title: "Study Reminder",
          message: `Time to study ${subject}!`,
          actionUrl: "/study-sessions"
        })
      }, timeUntilReminder)
    }
  }

  notifyTaskDeadline(taskTitle: string, dueDate: Date) {
    const now = new Date()
    const timeUntilDeadline = dueDate.getTime() - now.getTime()
    const hoursUntilDeadline = timeUntilDeadline / (1000 * 60 * 60)

    if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 0) {
      this.addNotification({
        type: "deadline",
        title: "Task Deadline Approaching",
        message: `"${taskTitle}" is due in ${Math.round(hoursUntilDeadline)} hours!`,
        actionUrl: "/dashboard"
      })
    }
  }

  notifyStudyGoalAchieved(goalType: string, target: number) {
    this.addNotification({
      type: "achievement",
      title: "Goal Achieved! 🎉",
      message: `Congratulations! You've reached your ${goalType} study goal of ${target} minutes!`,
      actionUrl: "/analytics"
    })
  }

  notifyStudyStreak(days: number) {
    this.addNotification({
      type: "achievement",
      title: "Study Streak! 🔥",
      message: `Amazing! You've maintained a ${days}-day study streak!`,
      actionUrl: "/dashboard"
    })
  }

  notifyTestScoreImprovement(subject: string, improvement: number) {
    this.addNotification({
      type: "achievement",
      title: "Score Improvement!",
      message: `Your ${subject} test score improved by ${improvement}%!`,
      actionUrl: "/test-marks"
    })
  }

  // Check for pending notifications (call this on app startup)
  checkPendingNotifications() {
    // Check for overdue tasks
    const tasks = JSON.parse(localStorage.getItem("tasks") || "[]")
    tasks.forEach((task: any) => {
      if (!task.completed && task.dueDate) {
        const dueDate = new Date(task.dueDate)
        if (isPast(dueDate) && !isToday(dueDate)) {
          this.addNotification({
            type: "deadline",
            title: "Overdue Task",
            message: `Task "${task.title}" is overdue!`,
            actionUrl: "/dashboard"
          })
        }
      }
    })

    // Check study goals
    const studyGoals = JSON.parse(localStorage.getItem("studyGoals") || "[]")
    studyGoals.forEach((goal: any) => {
      if (goal.current >= goal.target) {
        this.notifyStudyGoalAchieved(goal.type, goal.target)
      }
    })
  }
}

export const notificationManager = new NotificationManager()
