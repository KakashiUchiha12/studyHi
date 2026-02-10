import { describe, it, expect, beforeEach } from 'vitest'
import {
    formatBytes,
    calculateStoragePercentage,
    isStorageLimitExceeded,
    isBandwidthLimitExceeded,
    getTimeUntilBandwidthReset,
    shouldResetBandwidth,
    getNextBandwidthReset,
    validateFileSize,
    shouldPermanentlyDelete,
    STORAGE_LIMITS
} from '../storage'

describe('Storage Utilities', () => {
    describe('formatBytes', () => {
        it('should format 0 bytes', () => {
            expect(formatBytes(0)).toBe('0 Bytes')
        })

        it('should format bytes', () => {
            expect(formatBytes(500)).toBe('500 Bytes')
        })

        it('should format kilobytes', () => {
            expect(formatBytes(1024)).toBe('1 KB')
            expect(formatBytes(1536)).toBe('1.5 KB')
        })

        it('should format megabytes', () => {
            expect(formatBytes(1048576)).toBe('1 MB')
            expect(formatBytes(5242880)).toBe('5 MB')
        })

        it('should format gigabytes', () => {
            expect(formatBytes(1073741824)).toBe('1 GB')
            expect(formatBytes(10737418240)).toBe('10 GB')
        })

        it('should format terabytes', () => {
            expect(formatBytes(1099511627776)).toBe('1 TB')
        })
    })

    describe('calculateStoragePercentage', () => {
        it('should return 0 when limit is 0', () => {
            expect(calculateStoragePercentage(BigInt(100), BigInt(0))).toBe(0)
        })

        it('should calculate percentage correctly', () => {
            expect(calculateStoragePercentage(BigInt(5), BigInt(10))).toBe(50)
        })

        it('should handle 0% used', () => {
            expect(calculateStoragePercentage(BigInt(0), BigInt(100))).toBe(0)
        })

        it('should handle 100% used', () => {
            expect(calculateStoragePercentage(BigInt(100), BigInt(100))).toBe(100)
        })

        it('should handle fractional percentages', () => {
            const result = calculateStoragePercentage(BigInt(1), BigInt(3))
            expect(result).toBeCloseTo(33.33, 1)
        })

        // BUG TEST: Large number precision loss
        it('should handle large numbers', () => {
            const largeUsed = BigInt(9007199254740991) // Max safe int
            const largeLimit = BigInt(10007199254740991)
            const result = calculateStoragePercentage(largeUsed, largeLimit)
            expect(result).toBeGreaterThan(0)
            expect(result).toBeLessThan(100)
        })
    })

    describe('isStorageLimitExceeded', () => {
        it('should return false when under limit', () => {
            expect(isStorageLimitExceeded(BigInt(50), BigInt(100))).toBe(false)
        })

        it('should return true when over limit', () => {
            expect(isStorageLimitExceeded(BigInt(150), BigInt(100))).toBe(true)
        })

        it('should return false when exactly at limit', () => {
            expect(isStorageLimitExceeded(BigInt(100), BigInt(100))).toBe(false)
        })

        it('should consider additional size', () => {
            expect(isStorageLimitExceeded(BigInt(90), BigInt(100), 20)).toBe(true)
            expect(isStorageLimitExceeded(BigInt(90), BigInt(100), 5)).toBe(false)
        })
    })

    describe('isBandwidthLimitExceeded', () => {
        it('should return false when under limit', () => {
            expect(isBandwidthLimitExceeded(BigInt(5000000), BigInt(10000000))).toBe(false)
        })

        it('should return true when over limit', () => {
            expect(isBandwidthLimitExceeded(BigInt(15000000), BigInt(10000000))).toBe(true)
        })

        it('should consider additional size', () => {
            expect(isBandwidthLimitExceeded(BigInt(9000000), BigInt(10000000), 2000000)).toBe(true)
        })
    })

    describe('getTimeUntilBandwidthReset', () => {
        it('should return 0 for past reset time', () => {
            const pastDate = new Date(Date.now() - 1000)
            const result = getTimeUntilBandwidthReset(pastDate)
            expect(result.hours).toBe(0)
            expect(result.minutes).toBe(0)
            expect(result.seconds).toBe(0)
        })

        it('should calculate time correctly for future date', () => {
            const futureDate = new Date(Date.now() + 3600000) // 1 hour
            const result = getTimeUntilBandwidthReset(futureDate)
            expect(result.hours).toBe(0)
            expect(result.minutes).toBeGreaterThanOrEqual(59)
        })

        it('should handle 24 hours', () => {
            const tomorrow = new Date(Date.now() + 24 * 3600000)
            const result = getTimeUntilBandwidthReset(tomorrow)
            expect(result.hours).toBe(23)
            expect(result.minutes).toBeGreaterThanOrEqual(59)
        })
    })

    describe('shouldResetBandwidth', () => {
        it('should return true for past date', () => {
            const pastDate = new Date(Date.now() - 1000)
            expect(shouldResetBandwidth(pastDate)).toBe(true)
        })

        it('should return false for future date', () => {
            const futureDate = new Date(Date.now() + 1000)
            expect(shouldResetBandwidth(futureDate)).toBe(false)
        })

        it('should return true for current exact time', () => {
            const now = new Date()
            expect(shouldResetBandwidth(now)).toBe(true)
        })
    })

    describe('getNextBandwidthReset', () => {
        it('should return date 24 hours in future', () => {
            const reset = getNextBandwidthReset()
            const now = new Date()
            const diff = reset.getTime() - now.getTime()
            const hoursUntilReset = diff / (1000 * 60 * 60)

            expect(hoursUntilReset).toBeGreaterThanOrEqual(23.9)
            expect(hoursUntilReset).toBeLessThanOrEqual(24.1)
        })

        // BUG TEST: Should use fixed time, not relative
        it('should be consistent across calls within short time', () => {
            const reset1 = getNextBandwidthReset()
            const reset2 = getNextBandwidthReset()
            const diff = Math.abs(reset1.getTime() - reset2.getTime())
            expect(diff).toBeLessThan(100) // Should be within 100ms
        })
    })

    describe('validateFileSize', () => {
        it('should accept file under limit', () => {
            const result = validateFileSize(100 * 1024 * 1024) // 100MB
            expect(result.valid).toBe(true)
            expect(result.error).toBeUndefined()
        })

        it('should reject file over limit', () => {
            const result = validateFileSize(600 * 1024 * 1024) // 600MB
            expect(result.valid).toBe(false)
            expect(result.error).toContain('exceeds the maximum limit')
        })

        it('should accept file exactly at limit', () => {
            const result = validateFileSize(STORAGE_LIMITS.FILE_SIZE_LIMIT)
            expect(result.valid).toBe(true)
        })

        it('should reject file 1 byte over limit', () => {
            const result = validateFileSize(STORAGE_LIMITS.FILE_SIZE_LIMIT + 1)
            expect(result.valid).toBe(false)
        })
    })

    describe('shouldPermanentlyDelete', () => {
        it('should return false for recently deleted item', () => {
            const recentDate = new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
            expect(shouldPermanentlyDelete(recentDate)).toBe(false)
        })

        it('should return false for item deleted < 30 days ago', () => {
            const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
            expect(shouldPermanentlyDelete(twentyDaysAgo)).toBe(false)
        })

        it('should return true for item deleted exactly 30 days ago', () => {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            expect(shouldPermanentlyDelete(thirtyDaysAgo)).toBe(true)
        })

        it('should return true for item deleted > 30 days ago', () => {
            const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
            expect(shouldPermanentlyDelete(fortyDaysAgo)).toBe(true)
        })
    })
})
