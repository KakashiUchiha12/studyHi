/**
 * Rate limiting for Drive operations
 * In-memory implementation (use Redis in production for distributed systems)
 */

interface RateLimitConfig {
    max: number // Maximum requests
    windowMs: number // Time window in milliseconds
}

interface RateLimitEntry {
    count: number
    resetTime: number
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Rate limit configurations
export const RateLimits = {
    fileUpload: { max: 50, windowMs: 60 * 1000 }, // 50 uploads per minute
    folderCreate: { max: 20, windowMs: 60 * 1000 }, // 20 folders per minute
    fileDelete: { max: 50, windowMs: 60 * 1000 }, // 50 deletes per minute
    apiCall: { max: 100, windowMs: 60 * 1000 }, // 100 API calls per minute
    search: { max: 30, windowMs: 60 * 1000 }, // 30 searches per minute
}

/**
 * Check if operation is rate limited
 * Returns { allowed: boolean, resetTime?: Date }
 */
export function checkRateLimit(
    userId: string,
    operation: keyof typeof RateLimits
): { allowed: boolean; resetTime?: Date; remaining?: number } {
    const config = RateLimits[operation]
    const key = `${userId}:${operation}`
    const now = Date.now()

    // Get or create entry
    let entry = rateLimitStore.get(key)

    // Reset if window expired
    if (!entry || now > entry.resetTime) {
        entry = {
            count: 0,
            resetTime: now + config.windowMs
        }
        rateLimitStore.set(key, entry)
    }

    // Check limit
    if (entry.count >= config.max) {
        return {
            allowed: false,
            resetTime: new Date(entry.resetTime),
            remaining: 0
        }
    }

    // Increment counter
    entry.count++

    return {
        allowed: true,
        remaining: config.max - entry.count
    }
}

/**
 * Reset rate limit for a user/operation (for testing)
 */
export function resetRateLimit(userId: string, operation: keyof typeof RateLimits) {
    const key = `${userId}:${operation}`
    rateLimitStore.delete(key)
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimits() {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
        if (now > entry.resetTime) {
            rateLimitStore.delete(key)
        }
    }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupRateLimits, 5 * 60 * 1000)
}
