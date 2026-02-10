import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AssignmentCard } from '../assignment-card'
import { toast } from 'sonner'

vi.mock('sonner')

const mockAssignment = {
    id: 'assignment-1',
    title: 'Test Assignment',
    description: 'This is a test assignment',
    points: 100,
    dueDate: new Date('2026-12-31').toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    classId: 'class-1',
    postId: 'post-1',
    teacherId: 'teacher-1',
    allowLateSubmission: false,
    maxFileSize: BigInt(268435456),
    teacher: {
        id: 'teacher-1',
        name: 'Teacher Name',
        email: 'teacher@test.com',
        image: null,
    },
    _count: {
        submissions: 5,
    },
}

describe('AssignmentCard', () => {
    const mockOnUpdate = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render assignment details correctly', () => {
        render(
            <AssignmentCard
                assignment={mockAssignment}
                classId="class-1"
                userRole="student"
                onUpdate={mockOnUpdate}
            />
        )

        expect(screen.getByText('Test Assignment')).toBeInTheDocument()
        expect(screen.getByText('This is a test assignment')).toBeInTheDocument()
        expect(screen.getByText(/100 points/i)).toBeInTheDocument()
    })

    it('should show submit button for students without submission', () => {
        render(
            <AssignmentCard
                assignment={mockAssignment}
                classId="class-1"
                userRole="student"
                onUpdate={mockOnUpdate}
            />
        )

        expect(screen.getByText('Submit Assignment')).toBeInTheDocument()
    })

    it('should show edit and delete buttons for teachers', () => {
        render(
            <AssignmentCard
                assignment={mockAssignment}
                classId="class-1"
                userRole="teacher"
                onUpdate={mockOnUpdate}
            />
        )

        // Teachers should see edit button (Pencil icon)
        const editButton = screen.getByRole('button', { name: '' }).parentElement?.querySelector('svg')
        expect(editButton).toBeInTheDocument()
    })

    it('should NOT show edit button for admins', () => {
        const { container } = render(
            <AssignmentCard
                assignment={mockAssignment}
                classId="class-1"
                userRole="admin"
                onUpdate={mockOnUpdate}
            />
        )

        // Admins should not see edit button
        const editButtons = container.querySelectorAll('[class*="Pencil"]')
        expect(editButtons.length).toBe(0)
    })

    it('should show submission count for teachers', () => {
        render(
            <AssignmentCard
                assignment={mockAssignment}
                classId="class-1"
                userRole="teacher"
                onUpdate={mockOnUpdate}
            />
        )

        expect(screen.getByText(/5 submissions/i)).toBeInTheDocument()
    })

    it('should show overdue badge when past due date', () => {
        const overdueAssignment = {
            ...mockAssignment,
            dueDate: new Date('2020-01-01').toISOString(),
        }

        render(
            <AssignmentCard
                assignment={overdueAssignment}
                classId="class-1"
                userRole="student"
                onUpdate={mockOnUpdate}
            />
        )

        expect(screen.getByText('Overdue')).toBeInTheDocument()
    })

    it('should show submitted badge when user has submitted', () => {
        const submittedAssignment = {
            ...mockAssignment,
            userSubmission: {
                id: 'sub-1',
                assignmentId: 'assignment-1',
                studentId: 'student-1',
                submittedAt: new Date().toISOString(),
                files: [],
                isLate: false,
                grade: null,
                feedback: null,
            },
        }

        render(
            <AssignmentCard
                assignment={submittedAssignment}
                classId="class-1"
                userRole="student"
                onUpdate={mockOnUpdate}
            />
        )

        expect(screen.getByText('Submitted')).toBeInTheDocument()
    })

    it('should show graded badge with score when graded', () => {
        const gradedAssignment = {
            ...mockAssignment,
            userSubmission: {
                id: 'sub-1',
                assignmentId: 'assignment-1',
                studentId: 'student-1',
                submittedAt: new Date().toISOString(),
                files: [],
                isLate: false,
                grade: 85,
                feedback: 'Good work',
            },
        }

        render(
            <AssignmentCard
                assignment={gradedAssignment}
                classId="class-1"
                userRole="student"
                onUpdate={mockOnUpdate}
            />
        )

        expect(screen.getByText(/Graded: 85\/100/i)).toBeInTheDocument()
    })
})
