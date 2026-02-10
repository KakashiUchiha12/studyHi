import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}))

// Mock next-auth
vi.mock('next-auth/react', () => ({
    useSession: () => ({
        data: {
            user: {
                id: 'test-user-id',
                name: 'Test User',
                email: 'test@example.com',
            },
        },
        status: 'authenticated',
    }),
    SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}))
