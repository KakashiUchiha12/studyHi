"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useSession } from 'next-auth/react'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, Target, Award, FolderOpen } from "lucide-react"

// Import our new database hooks
import { useProfile, useGoals, useSkills, useDocuments } from '@/hooks'
import { Document, Goal as PrismaGoal } from '@/lib/database'

import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileSummary } from "@/components/profile/profile-summary"
import { OverviewTab } from "@/components/profile/overview-tab"
import { GoalsTab } from "@/components/profile/goals-tab"
import { EditProfileModal } from "@/components/profile/edit-profile-modal"
import { GoalModal } from "@/components/profile/goal-modal"
import { GoalTaskModal } from "@/components/profile/goal-task-modal"

interface GoalTask {
  id: string
  title: string
  priority: string
  dueDate?: Date
  completed: boolean
}

interface Goal extends PrismaGoal {
  tasks: GoalTask[]
}

interface Skill {
  id: string
  name: string
  description: string
  resources: string // JSON string from database
  objectives: SkillObjective[]
}

interface SkillObjective {
  id: string
  title: string
  description: string
  targetDate?: Date
  completed: boolean
}

interface ProfileData {
  fullName: string
  university?: string
  program?: string
  currentYear?: string
  gpa?: string
  bio?: string
  profilePicture?: string
}

export default function ProfilePage() {
  // ALL HOOKS MUST BE CALLED FIRST - before any conditional logic
  const { data: session, status } = useSession()

  // Database hooks
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    createProfile,
    updateProfile,
    refreshProfile
  } = useProfile()

  const {
    goals,
    loading: goalsLoading,
    error: goalsError,
    createGoal,
    updateGoal,
    deleteGoal,
    addGoalTask,
    updateGoalTask,
    toggleGoalTask,
    deleteGoalTask,
    reorderGoals,
    reorderGoalTasks,
    refreshGoals
  } = useGoals()

  const {
    skills,
    loading: skillsLoading,
    error: skillsError,
    createSkill,
    updateSkill,
    deleteSkill,
    addSkillObjective,
    updateSkillObjective,
    toggleSkillObjective,
    deleteSkillObjective,
    reorderSkills,
    reorderSkillObjectives,
    refreshSkills
  } = useSkills()

  const {
    documents,
    loading: documentsLoading,
    error: documentsError,
    uploadDocument,
    updateDocument,
    deleteDocument,
    toggleDocumentPin,
    reorderDocuments,
    refreshDocuments
  } = useDocuments()

  // Local UI state hooks
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: profile?.fullName || 'Student Name',
    university: profile?.university || '',
    program: profile?.program || '',
    currentYear: profile?.currentYear || '',
    gpa: profile?.gpa || '',
    bio: profile?.bio || 'Passionate computer science student focused on web development and data science. Always eager to learn new technologies and solve complex problems.'
  })

  const [activeTab, setActiveTab] = useState('overview')
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [showEditGoal, setShowEditGoal] = useState(false)
  const [showAddSkill, setShowAddSkill] = useState(false)
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({})
  const [newSkill, setNewSkill] = useState<Partial<Skill>>({})
  const [newSkillResource, setNewSkillResource] = useState<string>('')
  const [editingProfileData, setEditingProfileData] = useState<ProfileData>(profileData)
  const [newGoalTask, setNewGoalTask] = useState<Partial<GoalTask>>({})
  const [newSkillObjective, setNewSkillObjective] = useState<Partial<SkillObjective>>({})
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [showAddObjectiveModal, setShowAddObjectiveModal] = useState(false)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<GoalTask | null>(null)
  const [editingTaskGoal, setEditingTaskGoal] = useState<Goal | null>(null)
  const [showEditTaskModal, setShowEditTaskModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const profilePicRef = useRef<HTMLInputElement>(null)
  const documentFileRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const [editingSkillResource, setEditingSkillResource] = useState<string>('')
  const [selectedSkillForObjective, setSelectedSkillForObjective] = useState<Skill | null>(null)
  const [editingObjective, setEditingObjective] = useState<SkillObjective | null>(null)
  const [editingObjectiveSkill, setEditingObjectiveSkill] = useState<Skill | null>(null)
  const [showEditObjectiveModal, setShowEditObjectiveModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)

  // Update profileData when profile changes
  useEffect(() => {
    if (profile) {
      setProfileData({
        fullName: profile.fullName || 'Student Name',
        university: profile.university || '',
        program: profile.program || '',
        currentYear: profile.currentYear || '',
        gpa: profile.gpa || '',
        bio: profile.bio || 'Passionate computer science student focused on web development and data science. Always eager to learn new technologies and solve complex problems.'
      })
      setEditingProfileData({
        fullName: profile.fullName || 'Student Name',
        university: profile.university || '',
        program: profile.program || '',
        currentYear: profile.currentYear || '',
        gpa: profile.gpa || '',
        bio: profile.bio || 'Passionate computer science student focused on web development and data science. Always eager to learn new technologies and solve complex problems.'
      })
    }
  }, [profile])

  // Handle profile picture upload
  const handleProfilePictureUpload = async (file: File) => {
    try {
      console.log('Starting profile picture upload...', file.name)

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.url


        console.log('Upload successful, updating profile with:', imageUrl)

        // Update database
        await updateProfile({
          ...profileData,
          profilePicture: imageUrl
        })

        // Update local state immediately
        setProfileData(prev => ({ ...prev, profilePicture: imageUrl }))
        console.log('Profile picture updated successfully')
      }
    } catch (error) {
      console.error('Failed to upload profile picture:', error)
      alert("Failed to upload profile picture. Please try again.")
    }
  }

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    window.location.href = '/dashboard'
  }

  // Handle view all activity
  const handleViewAllActivity = () => {
    setShowActivityModal(true)
  }

  // Handle goal operations
  const handleAddGoal = () => {
    setShowAddGoal(true)
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setShowEditGoal(true)
  }

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await deleteGoal(goalId)
    } catch (error) {
      console.error('Failed to delete goal:', error)
    }
  }

  const handleAddTask = (goalId: string) => {
    setSelectedGoalId(goalId)
    setShowAddTaskModal(true)
  }

  const handleEditTask = (task: GoalTask) => {
    setEditingTask(task)
    setShowEditTaskModal(true)
  }

  const handleToggleTask = async (taskId: string) => {
    try {
      await toggleGoalTask(taskId)
    } catch (error) {
      console.error('Failed to toggle task:', error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteGoalTask(taskId)
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const handleReorderGoals = async (goalIds: string[]) => {
    try {
      await reorderGoals(goalIds)
    } catch (error) {
      console.error('Failed to reorder goals:', error)
    }
  }

  // Handle saving profile changes
  const handleSaveProfile = async (data: ProfileData) => {
    try {
      await updateProfile(data)
      // Update local state to reflect changes immediately
      setProfileData(data)
      setEditingProfile(false)
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  // Handle saving goal changes (create or update)
  const handleSaveGoal = async (goalData: Partial<Goal>) => {
    try {
      if (editingGoal) {
        // Update existing goal
        await updateGoal(editingGoal.id, {
          title: goalData.title,
          description: goalData.description,
          category: goalData.category as any,
          status: goalData.status as any,
          targetDate: goalData.targetDate ? new Date(goalData.targetDate) : undefined
        })
        setEditingGoal(null)
      } else {
        // Create new goal
        await createGoal({
          title: goalData.title || "New Goal",
          description: goalData.description || "",
          category: (goalData.category || "Academic") as any,
          status: (goalData.status || "In Progress") as any,
          targetDate: goalData.targetDate ? new Date(goalData.targetDate) : new Date() // Provide default date if required
        })
      }
      setShowAddGoal(false)
      setShowEditGoal(false)
    } catch (error) {
      console.error('Failed to save goal:', error)
    }
  }

  // Handle saving task changes (create or update)
  const handleSaveTask = async (taskData: Partial<GoalTask>) => {
    try {
      if (editingTask && editingTask.id) {
        // Update existing task
        await updateGoalTask(editingTask.id, {
          title: taskData.title,
          priority: taskData.priority as any,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
          completed: taskData.completed
        })
        setEditingTask(null)
      } else if (selectedGoalId) {
        // Create new task
        await addGoalTask(selectedGoalId, {
          title: taskData.title || "New Task",
          priority: (taskData.priority || "Medium") as any,
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined
        })
      }
      setShowAddTaskModal(false)
      setShowEditTaskModal(false)
    } catch (error) {
      console.error('Failed to save task:', error)
    }
  }

  // NOW we can have conditional logic and early returns
  // Check authentication
  if (status === "loading") {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading...</p>
      </div>
    </div>
  }

  if (status === "unauthenticated") {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Authentication Required</h1>
        <p className="text-slate-600 mb-6">Please log in to access your profile.</p>
        <Button onClick={() => window.location.href = '/auth/login'}>
          Go to Login
        </Button>
      </div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 md:p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <ProfileHeader onBackToDashboard={handleBackToDashboard} />

        {/* Profile Summary */}
        <ProfileSummary
          profileData={profileData}
          activeGoalsCount={goals.filter(g => g.status === 'active').length}
          onEditProfile={() => setEditingProfile(true)}
          onProfilePictureUpload={handleProfilePictureUpload}
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm p-1">
            <TabsTrigger value="overview" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm p-1.5 md:p-3 min-h-[32px] md:min-h-[44px]">
              <Eye className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm p-1.5 md:p-3 min-h-[32px] md:min-h-[44px]">
              <Target className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Goals</span>
              <span className="sm:hidden">Goals</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm p-1.5 md:p-3 min-h-[32px] md:min-h-[44px]">
              <Award className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Skills</span>
              <span className="sm:hidden">Skills</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center justify-center gap-1 md:gap-2 text-xs md:text-sm p-1.5 md:p-3 min-h-[32px] md:min-h-[44px]">
              <FolderOpen className="w-3 h-3 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Documents</span>
              <span className="sm:hidden">Docs</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <OverviewTab
              goals={goals as any}
              onViewAllActivity={handleViewAllActivity}
            />
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals">
            <GoalsTab
              goals={goals as any}
              onAddGoal={handleAddGoal}
              onEditGoal={handleEditGoal}
              onDeleteGoal={handleDeleteGoal}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onReorderGoals={handleReorderGoals}
            />
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills">
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">Skills Tab</h3>
              <p className="text-slate-500">Skills functionality coming soon...</p>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-600 mb-2">Documents Tab</h3>
              <p className="text-slate-500">Documents functionality coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <EditProfileModal
          isOpen={editingProfile}
          onClose={() => setEditingProfile(false)}
          onSave={handleSaveProfile}
          initialData={profileData}
        />

        <GoalModal
          isOpen={showAddGoal || showEditGoal}
          onClose={() => {
            setShowAddGoal(false)
            setShowEditGoal(false)
            setEditingGoal(null)
          }}
          onSave={handleSaveGoal}
          initialData={editingGoal}
          mode={editingGoal ? "edit" : "create"}
        />

        <GoalTaskModal
          isOpen={showAddTaskModal || showEditTaskModal}
          onClose={() => {
            setShowAddTaskModal(false)
            setShowEditTaskModal(false)
            setEditingTask(null)
          }}
          onSave={handleSaveTask}
          initialData={editingTask}
          mode={editingTask ? "edit" : "create"}
        />
      </div>
    </div>
  )
}


