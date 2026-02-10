export type ClassRole = 'admin' | 'teacher' | 'student'
export type ClassMemberStatus = 'pending' | 'approved' | 'rejected'
export type PostType = 'general' | 'announcement' | 'material' | 'question'

export interface User {
  id: string
  name: string | null
  email: string
  image: string | null
}

export interface Class {
  id: string
  name: string
  description: string | null
  subject: string | null
  syllabus: string | null
  room: string | null
  coverImage: string | null
  icon: string | null
  bannerImage: string | null
  joinCode: string
  createdBy: string
  createdAt: Date | string
  updatedAt: Date | string
  allowStudentPosts: boolean
  allowComments: boolean
  archived: boolean
  creator?: User
  role?: ClassRole
  memberCount?: number
  assignmentCount?: number
  _count?: {
    members: number
    assignments: number
  }
}

export interface ClassMember {
  id: string
  classId: string
  userId: string
  role: ClassRole
  status: ClassMemberStatus
  joinedAt: Date | string
  mutedNotifications: boolean
  user?: User
}

export interface ClassPost {
  id: string
  classId: string
  authorId: string
  type: PostType
  title: string | null
  content: string
  attachments: string[]
  pinned: boolean
  createdAt: Date | string
  updatedAt: Date | string
  author?: User
  _count?: {
    likes: number
    comments: number
  }
}

export interface PostComment {
  id: string
  postId: string
  authorId: string
  content: string
  createdAt: Date | string
  author?: User
}

export interface PostLike {
  id: string
  postId: string
  userId: string
  createdAt: Date | string
}

export interface Assignment {
  id: string
  classId: string
  postId: string
  teacherId: string
  title: string
  description: string
  dueDate: Date | string
  allowLateSubmission: boolean
  maxFileSize: bigint | number
  createdAt: Date | string
  updatedAt: Date | string
  attachments?: string[]
  teacher?: User
  _count?: {
    submissions: number
  }
  userSubmission?: Submission
}

export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  files: { url: string; name: string; size: number }[]
  submittedAt: Date | string
  isLate: boolean
  grade: number | null
  feedback: string | null
  gradedAt: Date | string | null
  gradedBy: string | null
  student?: User
  grader?: User
}

export interface ClassResource {
  id: string
  classId: string
  uploadedBy: string
  title: string
  description: string | null
  fileUrl: string
  fileType: string
  fileSize: number
  category: string | null
  uploadedAt: Date | string
  uploader?: User
}

export interface ClassNotification {
  id: string
  classId: string
  userId: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: Date | string
}
