import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getPosts, POST as createPost } from '@/app/api/classes/[id]/posts/route'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
    authOptions: {},
}))

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}))

vi.mock('@/lib/database', () => ({
    dbService: {
        getPrisma: vi.fn(),
    },
}))

vi.mock('@/lib/classes/permissions', () => ({
    isClassMember: vi.fn(),
    isTeacherOrAdmin: vi.fn(),
}))

import { getServerSession } from 'next-auth'
import { dbService } from '@/lib/database'
import { isClassMember, isTeacherOrAdmin } from '@/lib/classes/permissions'

describe('Posts API - GET /api/classes/[id]/posts', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return 401 when not authenticated', async () => {
        (getServerSession as any).mockResolvedValue(null)

        const request = new NextRequest('http://localhost/api/classes/class-1/posts')
        const params = Promise.resolve({ id: 'class-1' })

        const response = await getPosts(request, { params })
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Authentication required')
    })

    it('should return 403 when user is not a class member', async () => {
        (getServerSession as any).mockResolvedValue({
            user: { id: 'user-1', name: 'Test User' },
        })
            ; (isClassMember as any).mockResolvedValue(false)

        const request = new NextRequest('http://localhost/api/classes/class-1/posts')
        const params = Promise.resolve({ id: 'class-1' })

        const response = await getPosts(request, { params })
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Access denied')
    })

    it('should return posts with pagination', async () => {
        const mockPosts = [
            {
                id: 'post-1',
                title: 'Post 1',
                content: 'Content 1',
                createdAt: new Date(),
            },
            {
                id: 'post-2',
                title: 'Post 2',
                content: 'Content 2',
                createdAt: new Date(),
            },
        ]

            ; (getServerSession as any).mockResolvedValue({
                user: { id: 'user-1' },
            })
            ; (isClassMember as any).mockResolvedValue(true)
            ; (dbService.getPrisma as any).mockReturnValue({
                classPost: {
                    findMany: vi.fn().mockResolvedValue(mockPosts),
                },
            })

        const request = new NextRequest('http://localhost/api/classes/class-1/posts')
        const params = Promise.resolve({ id: 'class-1' })

        const response = await getPosts(request, { params })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(Array.isArray(data)).toBe(true)
    })
})

describe('Posts API - POST /api/classes/[id]/posts', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return 401 when not authenticated', async () => {
        (getServerSession as any).mockResolvedValue(null)

        const request = new NextRequest('http://localhost/api/classes/class-1/posts', {
            method: 'POST',
            body: JSON.stringify({ type: 'general', content: 'Test' }),
        })
        const params = Promise.resolve({ id: 'class-1' })

        const response = await createPost(request, { params })
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Authentication required')
    })

    it('should return 403 when user cannot create posts', async () => {
        (getServerSession as any).mockResolvedValue({
            user: { id: 'user-1' },
        })
            ; (isTeacherOrAdmin as any).mockResolvedValue(false)

        const request = new NextRequest('http://localhost/api/classes/class-1/posts', {
            method: 'POST',
            body: JSON.stringify({ type: 'general', content: 'Test' }),
        })
        const params = Promise.resolve({ id: 'class-1' })

        const response = await createPost(request, { params })
        const data = await response.json()

        expect(response.status).toBe(403)
        expect(data.error).toBe('Permission denied')
    })

    it('should return 400 when missing required fields', async () => {
        (getServerSession as any).mockResolvedValue({
            user: { id: 'user-1' },
        })
            ; (isTeacherOrAdmin as any).mockResolvedValue(true)

        const request = new NextRequest('http://localhost/api/classes/class-1/posts', {
            method: 'POST',
            body: JSON.stringify({ type: 'general' }), // Missing content
        })
        const params = Promise.resolve({ id: 'class-1' })

        const response = await createPost(request, { params })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toContain('required')
    })
})
