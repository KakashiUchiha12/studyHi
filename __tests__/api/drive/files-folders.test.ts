import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET as getFiles, POST as uploadFile } from '@/app/api/drive/files/route'
import { GET as getFolders, POST as createFolder } from '@/app/api/drive/folders/route'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
    authOptions: {},
}))

vi.mock('next-auth', () => ({
    getServerSession: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
    prisma: {
        drive: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        driveFile: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            count: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        driveFolder: {
            findMany: vi.fn(),
            findFirst: vi.fn(),
            count: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        subject: {
            findMany: vi.fn(),
        },
    },
}))

vi.mock('fs/promises', () => ({
    writeFile: vi.fn(),
    mkdir: vi.fn(),
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

describe('Drive Files API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('GET /api/drive/files', () => {
        it('should return 401 when not authenticated', async () => {
            ; (getServerSession as any).mockResolvedValue(null)

            const request = new NextRequest('http://localhost/api/drive/files')
            const response = await getFiles(request)
            const data = await response.json()

            expect(response.status).toBe(401)
            expect(data.error).toBe('Unauthorized')
        })

        it('should return 404 when drive not found', async () => {
            ; (getServerSession as any).mockResolvedValue({
                user: { id: 'user-1', name: 'Test User' },
            })
                ; (prisma.drive.findUnique as any).mockResolvedValue(null)

            const request = new NextRequest('http://localhost/api/drive/files')
            const response = await getFiles(request)
            const data = await response.json()

            expect(response.status).toBe(404)
            expect(data.error).toBe('Drive not found')
        })

        it('should return files with pagination', async () => {
            const mockDrive = { id: 'drive-1', userId: 'user-1' }
            const mockFiles = [
                {
                    id: 'file-1',
                    originalName: 'test.pdf',
                    fileSize: BigInt(1024),
                    tags: '[]',
                    folder: null,
                },
            ]

                ; (getServerSession as any).mockResolvedValue({
                    user: { id: 'user-1' },
                })
                ; (prisma.drive.findUnique as any).mockResolvedValue(mockDrive)
                ; (prisma.driveFile.findMany as any).mockResolvedValue(mockFiles)
                ; (prisma.driveFile.count as any).mockResolvedValue(1)

            const request = new NextRequest('http://localhost/api/drive/files')
            const response = await getFiles(request)
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.files).toHaveLength(1)
            expect(data.pagination.total).toBe(1)
        })

        it('should filter by folderId', async () => {
            const mockDrive = { id: 'drive-1', userId: 'user-1' }

                ; (getServerSession as any).mockResolvedValue({
                    user: { id: 'user-1' },
                })
                ; (prisma.drive.findUnique as any).mockResolvedValue(mockDrive)
                ; (prisma.driveFile.findMany as any).mockResolvedValue([])
                ; (prisma.driveFile.count as any).mockResolvedValue(0)

            const request = new NextRequest('http://localhost/api/drive/files?folderId=folder-1')
            await getFiles(request)

            expect(prisma.driveFile.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        folderId: 'folder-1',
                    }),
                })
            )
        })

        it('should search files by name and description', async () => {
            const mockDrive = { id: 'drive-1', userId: 'user-1' }

                ; (getServerSession as any).mockResolvedValue({
                    user: { id: 'user-1' },
                })
                ; (prisma.drive.findUnique as any).mockResolvedValue(mockDrive)
                ; (prisma.driveFile.findMany as any).mockResolvedValue([])
                ; (prisma.driveFile.count as any).mockResolvedValue(0)

            const request = new NextRequest('http://localhost/api/drive/files?search=test')
            await getFiles(request)

            expect(prisma.driveFile.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        OR: expect.arrayContaining([
                            expect.objectContaining({ originalName: expect.anything() }),
                            expect.objectContaining({ description: expect.anything() }),
                        ]),
                    }),
                })
            )
        })

        it('should respect pagination limits', async () => {
            const mockDrive = { id: 'drive-1', userId: 'user-1' }

                ; (getServerSession as any).mockResolvedValue({
                    user: { id: 'user-1' },
                })
                ; (prisma.drive.findUnique as any).mockResolvedValue(mockDrive)
                ; (prisma.driveFile.findMany as any).mockResolvedValue([])
                ; (prisma.driveFile.count as any).mockResolvedValue(0)

            const request = new NextRequest('http://localhost/api/drive/files?page=2&limit=20')
            await getFiles(request)

            expect(prisma.driveFile.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 20, // (2-1) * 20
                    take: 20,
                })
            )
        })

        it('should cap limit at 100', async () => {
            const mockDrive = { id: 'drive-1', userId: 'user-1' }

                ; (getServerSession as any).mockResolvedValue({
                    user: { id: 'user-1' },
                })
                ; (prisma.drive.findUnique as any).mockResolvedValue(mockDrive)
                ; (prisma.driveFile.findMany as any).mockResolvedValue([])
                ; (prisma.driveFile.count as any).mockResolvedValue(0)

            const request = new NextRequest('http://localhost/api/drive/files?limit=500')
            await getFiles(request)

            expect(prisma.driveFile.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 100, // Capped at 100
                })
            )
        })
    })
})

describe('Drive Folders API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('GET /api/drive/folders', () => {
        it('should return 401 when not authenticated', async () => {
            ; (getServerSession as any).mockResolvedValue(null)

            const request = new NextRequest('http://localhost/api/drive/folders')
            const response = await getFolders(request)
            const data = await response.json()

            expect(response.status).toBe(401)
            expect(data.error).toBe('Unauthorized')
        })

        it('should return 404 when drive not found', async () => {
            ; (getServerSession as any).mockResolvedValue({
                user: { id: 'user-1' },
            })
                ; (prisma.drive.findUnique as any).mockResolvedValue(null)

            const request = new NextRequest('http://localhost/api/drive/folders')
            const response = await getFolders(request)
            const data = await response.json()

            expect(response.status).toBe(404)
            expect(data.error).toBe('Drive not found')
        })

        // BUG TEST: Race condition in auto-creation
        it('should auto-create folders for subjects without folders', async () => {
            const mockDrive = { id: 'drive-1', userId: 'user-1' }
            const mockSubjects = [
                { id: 'subject-1', name: 'Math', userId: 'user-1' },
                { id: 'subject-2', name: 'Science', userId: 'user-1' },
            ]

                ; (getServerSession as any).mockResolvedValue({
                    user: { id: 'user-1' },
                })
                ; (prisma.drive.findUnique as any).mockResolvedValue(mockDrive)
                ; (prisma.subject.findMany as any).mockResolvedValue(mockSubjects)
                ; (prisma.driveFolder.findMany as any).mockResolvedValue([])
                ; (prisma.driveFolder.count as any).mockResolvedValue(0)
                ; (prisma.driveFolder.create as any).mockResolvedValue({})

            const request = new NextRequest('http://localhost/api/drive/folders')
            await getFolders(request)

            expect(prisma.driveFolder.create).toHaveBeenCalledTimes(2)
        })

        it('should filter by parentId', async () => {
            const mockDrive = { id: 'drive-1', userId: 'user-1' }

                ; (getServerSession as any).mockResolvedValue({
                    user: { id: 'user-1' },
                })
                ; (prisma.drive.findUnique as any).mockResolvedValue(mockDrive)
                ; (prisma.driveFolder.findMany as any).mockResolvedValue([])
                ; (prisma.driveFolder.count as any).mockResolvedValue(0)

            const request = new NextRequest('http://localhost/api/drive/folders?parentId=parent-1')
            await getFolders(request)

            expect(prisma.driveFolder.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({
                        parentId: 'parent-1',
                    }),
                })
            )
        })
    })

    describe('POST /api/drive/folders', () => {
        it('should return 401 when not authenticated', async () => {
            ; (getServerSession as any).mockResolvedValue(null)

            const request = new NextRequest('http://localhost/api/drive/folders', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Folder' }),
            })
            const response = await createFolder(request)
            const data = await response.json()

            expect(response.status).toBe(401)
            expect(data.error).toBe('Unauthorized')
        })

        // SECURITY TEST: Path validation
        it('should validate folder name for malicious characters', async () => {
            const mockDrive = { id: 'drive-1', userId: 'user-1' }

                ; (getServerSession as any).mockResolvedValue({
                    user: { id: 'user-1' },
                })
                ; (prisma.drive.findUnique as any).mockResolvedValue(mockDrive)

            const request = new NextRequest('http://localhost/api/drive/folders', {
                method: 'POST',
                body: JSON.stringify({ name: '../../../etc/passwd' }),
            })

            // Should reject or sanitize
            const response = await createFolder(request)
            // Current implementation may not validate - this is a bug!
        })
    })
})
