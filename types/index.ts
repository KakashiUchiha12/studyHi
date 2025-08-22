export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  createdAt: Date
  dueDate?: Date
  priority: 'low' | 'medium' | 'high'
  category: string
  estimatedTime?: number
  tags: string[]
  subject: string
  progress: number
  timeSpent: number
}

export interface Subject {
  id: string
  name: string
  code: string
  credits: number
  instructor: string
  color: string
  progress: number
  nextExam?: Date
  assignmentsDue: number
  materials: string[]
  topics: string[]
  completedChapters: number
  totalChapters: number
}

export interface StudySession {
  id: string
  subject: string
  duration: number
  date: Date
  notes: string
  efficiency: number
  sessionType: 'Focused Study' | 'Review' | 'Practice' | 'Group Study'
  productivity: number
  topicsCovered: string[]
  materialsUsed: string[]
}

export interface TestMark {
  id: string
  date: Date
  subjectId: string
  subjectName: string
  marksObtained: number
  totalMarks: number
  title: string
  percentage: number
  grade: string
}

export interface StudyGoal {
  id: string
  type: 'daily' | 'weekly' | 'monthly'
  target: number
  current: number
  period: string
}

export interface Material {
  id: string
  name: string
  type: 'textbook' | 'video' | 'article' | 'other'
  files: string[]
  links: string[]
  createdAt: string
}
