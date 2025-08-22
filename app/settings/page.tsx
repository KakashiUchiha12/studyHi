"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Settings, 
  Bell, 
  Target, 
  Database, 
  Download, 
  Upload,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import Link from "next/link"

interface UserSettings {
  studyGoals: {
    dailyHours: number
    weeklyHours: number
    monthlyHours: number
    autoCalculate: boolean
  }
  notifications: {
    taskReminders: boolean
    studySessionAlerts: boolean
    emailNotifications: boolean
    pushNotifications: boolean
    reminderTime: string
  }
  dataManagement: {
    autoBackup: boolean
    backupFrequency: string
    exportFormat: string
  }
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings>({
    studyGoals: {
      dailyHours: 2,
      weeklyHours: 10,
      monthlyHours: 40,
      autoCalculate: true
    },
    notifications: {
      taskReminders: true,
      studySessionAlerts: true,
      emailNotifications: false,
      pushNotifications: true,
      reminderTime: "09:00"
    },
    dataManagement: {
      autoBackup: true,
      backupFrequency: "weekly",
      exportFormat: "json"
    }
  })

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/login")
      return
    }

    // Load settings from localStorage
    const savedSettings = localStorage.getItem("userSettings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        console.log('Settings loaded from localStorage:', parsed)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.error("Failed to parse saved settings:", error)
      }
    } else {
      console.log('No saved settings found in localStorage')
    }
  }, [router, status])

  // Keep weekly and monthly goals in sync when autoCalculate is enabled
  useEffect(() => {
    if (settings.studyGoals.autoCalculate) {
      const expectedWeekly = settings.studyGoals.dailyHours * 7
      const expectedMonthly = settings.studyGoals.dailyHours * 30
      
      if (settings.studyGoals.weeklyHours !== expectedWeekly || 
          settings.studyGoals.monthlyHours !== expectedMonthly) {
        console.log('Auto-calculating weekly and monthly goals to match daily goal')
        saveSettings({
          studyGoals: {
            ...settings.studyGoals,
            weeklyHours: expectedWeekly,
            monthlyHours: expectedMonthly
          }
        })
      }
    }
  }, [settings.studyGoals.dailyHours, settings.studyGoals.autoCalculate])

  const saveSettings = (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    console.log('Saving settings to localStorage:', updatedSettings)
    setSettings(updatedSettings)
    localStorage.setItem("userSettings", JSON.stringify(updatedSettings))
    console.log('Settings saved successfully')
  }

  const exportData = () => {
    const data = {
      studySessions: JSON.parse(localStorage.getItem("studySessions") || "[]"),
      tasks: JSON.parse(localStorage.getItem("tasks") || "[]"),
      subjects: JSON.parse(localStorage.getItem("subjects") || "[]"),
      testMarks: JSON.parse(localStorage.getItem("testMarks") || "[]"),
      settings: settings
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `study-planner-data-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        // Import data to localStorage
        if (data.studySessions) localStorage.setItem("studySessions", JSON.stringify(data.studySessions))
        if (data.tasks) localStorage.setItem("tasks", JSON.stringify(data.tasks))
        if (data.subjects) localStorage.setItem("subjects", JSON.stringify(data.subjects))
        if (data.testMarks) localStorage.setItem("testMarks", JSON.stringify(data.testMarks))
        if (data.settings) {
          setSettings(data.settings)
          localStorage.setItem("userSettings", JSON.stringify(data.settings))
        }
        
        alert("Data imported successfully!")
      } catch (error) {
        alert("Failed to import data. Please check the file format.")
      }
    }
    reader.readAsText(file)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 sm:h-16 items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <span className="text-lg sm:text-xl font-bold text-foreground">Settings</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 sm:p-6 space-y-6">
        {/* Page Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Settings & Preferences</h1>
          <p className="text-muted-foreground">Customize your study planner experience</p>
        </div>

        {/* Study Goals Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Study Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dailyHours">Daily Goal (hours)</Label>
                <Input
                  id="dailyHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={settings.studyGoals.dailyHours}
                  onChange={(e) => {
                    const newDailyHours = parseFloat(e.target.value) || 0
                    const newSettings = {
                      studyGoals: {
                        ...settings.studyGoals,
                        dailyHours: newDailyHours
                      }
                    }
                    
                    // If autoCalculate is enabled, also update weekly and monthly
                    if (settings.studyGoals.autoCalculate) {
                      newSettings.studyGoals.weeklyHours = newDailyHours * 7
                      newSettings.studyGoals.monthlyHours = newDailyHours * 30
                    }
                    
                    saveSettings(newSettings)
                  }}
                  disabled={settings.studyGoals.autoCalculate}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="weeklyHours">Weekly Goal (hours)</Label>
                <Input
                  id="weeklyHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={settings.studyGoals.weeklyHours}
                  onChange={(e) => saveSettings({
                    studyGoals: {
                      ...settings.studyGoals,
                      weeklyHours: parseFloat(e.target.value) || 0
                    }
                  })}
                  disabled={settings.studyGoals.autoCalculate}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monthlyHours">Monthly Goal (hours)</Label>
                <Input
                  id="monthlyHours"
                  type="number"
                  min="0"
                  step="0.5"
                  value={settings.studyGoals.monthlyHours}
                  onChange={(e) => saveSettings({
                    studyGoals: {
                      ...settings.studyGoals,
                      monthlyHours: parseFloat(e.target.value) || 0
                    }
                  })}
                  disabled={settings.studyGoals.autoCalculate}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="autoCalculate"
                checked={settings.studyGoals.autoCalculate}
                onCheckedChange={(checked) => {
                  const newSettings = {
                    studyGoals: {
                      ...settings.studyGoals,
                      autoCalculate: checked
                    }
                  }
                  
                  // If enabling autoCalculate, update weekly and monthly values
                  if (checked) {
                    newSettings.studyGoals.weeklyHours = settings.studyGoals.dailyHours * 7
                    newSettings.studyGoals.monthlyHours = settings.studyGoals.dailyHours * 30
                  }
                  
                  saveSettings(newSettings)
                }}
              />
              <Label htmlFor="autoCalculate">Auto-calculate from daily goal</Label>
            </div>
            
            {settings.studyGoals.autoCalculate && (
              <div className="text-sm text-muted-foreground">
                Weekly: {settings.studyGoals.dailyHours * 7}h | Monthly: {settings.studyGoals.dailyHours * 30}h
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Task Reminders */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Task Reminders</h3>
                  <p className="text-sm text-muted-foreground">Get notified about upcoming deadlines</p>
                </div>
                <Switch
                  checked={settings.notifications.taskReminders}
                  onCheckedChange={(checked) => saveSettings({
                    notifications: {
                      ...settings.notifications,
                      taskReminders: checked
                    }
                  })}
                />
              </div>
              
              {settings.notifications.taskReminders && (
                <div className="ml-6 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.notifications.emailNotifications}
                      onCheckedChange={(checked) => saveSettings({
                        notifications: {
                          ...settings.notifications,
                          emailNotifications: checked
                        }
                      })}
                    />
                    <Label>Email notifications</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.notifications.pushNotifications}
                      onCheckedChange={(checked) => saveSettings({
                        notifications: {
                          ...settings.notifications,
                          pushNotifications: checked
                        }
                      })}
                    />
                    <Label>Push notifications</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Reminder time</Label>
                    <Input
                      type="time"
                      value={settings.notifications.reminderTime}
                      onChange={(e) => saveSettings({
                        notifications: {
                          ...settings.notifications,
                          reminderTime: e.target.value
                        }
                      })}
                      className="w-32"
                    />
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Study Session Alerts */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Study Session Alerts</h3>
                  <p className="text-sm text-muted-foreground">Reminders to start study sessions</p>
                </div>
                <Switch
                  checked={settings.notifications.studySessionAlerts}
                  onCheckedChange={(checked) => saveSettings({
                    notifications: {
                      ...settings.notifications,
                      studySessionAlerts: checked
                    }
                  })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Management Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Export Data */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Export Data</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Download all your study data as a JSON file
                </p>
                <Button onClick={exportData} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
              </div>
            </div>

            <Separator />

            {/* Import Data */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Import Data</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Restore your data from a previously exported file
                </p>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Backup Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Auto Backup</h3>
                  <p className="text-sm text-muted-foreground">Automatically backup your data</p>
                </div>
                <Switch
                  checked={settings.dataManagement.autoBackup}
                  onCheckedChange={(checked) => saveSettings({
                    dataManagement: {
                      ...settings.dataManagement,
                      autoBackup: checked
                    }
                  })}
                />
              </div>
              
              {settings.dataManagement.autoBackup && (
                <div className="ml-6 space-y-3">
                  <div className="space-y-2">
                    <Label>Backup frequency</Label>
                    <Select
                      value={settings.dataManagement.backupFrequency}
                      onValueChange={(value) => saveSettings({
                        dataManagement: {
                          ...settings.dataManagement,
                          backupFrequency: value
                        }
                      })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Data Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Data Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {JSON.parse(localStorage.getItem("studySessions") || "[]").length}
                </div>
                <p className="text-sm text-muted-foreground">Study Sessions</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-success">
                  {JSON.parse(localStorage.getItem("tasks") || "[]").length}
                </div>
                <p className="text-sm text-muted-foreground">Tasks</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-warning">
                  {JSON.parse(localStorage.getItem("subjects") || "[]").length}
                </div>
                <p className="text-sm text-muted-foreground">Subjects</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-info">
                  {JSON.parse(localStorage.getItem("testMarks") || "[]").length}
                </div>
                <p className="text-sm text-muted-foreground">Test Marks</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
