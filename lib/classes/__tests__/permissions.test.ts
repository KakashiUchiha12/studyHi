import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    isClassAdmin,
    isTeacherOrAdmin,
    isClassMember,
    canCreateAssignments,
    canEditAssignments,
    canViewSubmissions,
    canGradeAssignments,
    getUserClassRole
} from '../permissions'
import { dbService } from '@/lib/database'

// Mock the database service
vi.mock('@/lib/database', () => ({
    dbService: {
        getPrisma: vi.fn()
    }
}))

describe('Class Permissions', () => {
    const mockClassId = 'class-123'
    const mockUserId = 'user-456'

    let mockPrismaFind: any

    beforeEach(() => {
        vi.clearAllMocks()
        mockPrismaFind = vi.fn()
            ; (dbService.getPrisma as any).mockReturnValue({
                classMember: {
                    findFirst: mockPrismaFind
                }
            })
    })

    describe('getUserClassRole', () => {
        it('should return user role when member exists', async () => {
            mockPrismaFind.mockResolvedValue({
                role: 'teacher',
                status: 'approved'
            })

            const role = await getUserClassRole(mockClassId, mockUserId)

            expect(role).toBe('teacher')
            expect(mockPrismaFind).toHaveBeenCalledWith({
                where: {
                    classId: mockClassId,
                    userId: mockUserId,
                    status: 'approved'
                },
                select: {
                    role: true
                }
            })
        })

        it('should return null when member does not exist', async () => {
            mockPrismaFind.mockResolvedValue(null)

            const role = await getUserClassRole(mockClassId, mockUserId)

            expect(role).toBeNull()
        })
    })

    describe('isClassAdmin', () => {
        it('should return true for admin role', async () => {
            mockPrismaFind.mockResolvedValue({ role: 'admin', status: 'approved' })

            const result = await isClassAdmin(mockClassId, mockUserId)

            expect(result).toBe(true)
        })

        it('should return true for teacher role', async () => {
            mockPrismaFind.mockResolvedValue({ role: 'teacher', status: 'approved' })

            const result = await isClassAdmin(mockClassId, mockUserId)

            expect(result).toBe(true)
        })

        it('should return false for student role', async () => {
            mockPrismaFind.mockResolvedValue({ role: 'student', status: 'approved' })

            const result = await isClassAdmin(mockClassId, mockUserId)

            expect(result).toBe(false)
        })

        it('should return false when not a member', async () => {
            mockPrismaFind.mockResolvedValue(null)

            const result = await isClassAdmin(mockClassId, mockUserId)

            expect(result).toBe(false)
        })
    })

    describe('canCreateAssignments', () => {
        it('should allow teachers to create assignments', async () => {
            mockPrismaFind.mockResolvedValue({ role: 'teacher', status: 'approved' })

            const result = await canCreateAssignments(mockUserId, mockClassId)

            expect(result).toBe(true)
        })

        it('should allow admins to create assignments', async () => {
            mockPrismaFind.mockResolvedValue({ role: 'admin', status: 'approved' })

            const result = await canCreateAssignments(mockUserId, mockClassId)

            expect(result).toBe(true)
        })

        it('should not allow students to create assignments', async () => {
            mockPrismaFind.mockResolvedValue({ role: 'student', status: 'approved' })

            const result = await canCreateAssignments(mockUserId, mockClassId)

            expect(result).toBe(false)
        })
    })

    describe('canEditAssignments', () => {
        it('should allow teachers to edit assignments', async () => {
            mockPrismaFind.mockResolvedValue({ role: 'teacher', status: 'approved' })

            const result = await canEditAssignments(mockUserId, mockClassId)

            expect(result).toBe(true)
        })

        it('should NOT allow admins to edit assignments', async () => {
            mockPrismaFind.mockResolvedValue({ role: 'admin', status: 'approved' })

            const result = await canEditAssignments(mockUserId, mockClassId)

            expect(result).toBe(false)
        })

        it('should NOT allow students to edit assignments', async () => {
            mockPrismaFind.mockResolvedValue({ role: 'student', status: 'approved' })

            const result = await canEditAssignments(mockUserId, mockClassId)

            expect(result).toBe(false)
        })
    })

    describe('canViewSubmissions', () => {
        it('should allow teachers to view submissions', async () => {
            mockPrismaFind.mockResolvedValue({ role: 'teacher', status: 'approved' })

            const result = await canViewSubmissions(mockUserId, mockClassId)

            expect(result).toBe(true)
        })

        it('should NOT allow admins to view submissions', async () => {
            mockPrismaFind.mockResolvedValue({ role: 'admin', status: 'approved' })

            const result = await canViewSubmissions(mockUserId, mockClassId)

            expect(result).toBe(false)
        })

        it('should NOT allow students to view submissions', async () => {
            mockPrismaFind.mockResolvedValue({ role: 'student', status: 'approved' })

            const result = await canViewSubmissions(mockUserId, mockClassId)

            expect(result).toBe(false)
        })
    })

    describe('canGradeAssignments', () => {
        it('should allow teachers to grade assignments', async () => {
            mockPrismaFind.mockResolvedValue({ role: 'teacher', status: 'approved' })

            const result = await canGradeAssignments(mockUserId, mockClassId)

            expect(result).toBe(true)
        })

        it('should NOT allow admins to grade assignments', async () => {
            mockPrismaFind.mockResolvedValue({ role: 'admin', status: 'approved' })

            const result = await canGradeAssignments(mockUserId, mockClassId)

            expect(result).toBe(false)
        })

        it('should NOT allow students to grade assignments', async () => {
            mockPrismaFind.mockResolvedValue({ role: 'student', status: 'approved' })

            const result = await canGradeAssignments(mockUserId, mockClassId)

            expect(result).toBe(false)
        })
    })
})
