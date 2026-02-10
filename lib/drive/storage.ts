/**
 * Storage calculation utilities for Study Drive
 */

export const STORAGE_LIMITS = {
  USER_STORAGE_LIMIT: 10 * 1024 * 1024 * 1024, // 10GB in bytes
  FILE_SIZE_LIMIT: 500 * 1024 * 1024, // 500MB in bytes
  DAILY_BANDWIDTH_LIMIT: 10 * 1024 * 1024 * 1024, // 10GB in bytes
  TRASH_RETENTION_DAYS: 30,
};

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Calculate storage percentage used
 */
export function calculateStoragePercentage(used: bigint, limit: bigint): number {
  if (limit === BigInt(0)) return 0;
  return (Number(used) / Number(limit)) * 100;
}

/**
 * Check if storage limit is exceeded
 */
export function isStorageLimitExceeded(used: bigint, limit: bigint, additionalSize: number = 0): boolean {
  return used + BigInt(additionalSize) > limit;
}

/**
 * Check if bandwidth limit is exceeded
 */
export function isBandwidthLimitExceeded(used: bigint, limit: bigint, additionalSize: number = 0): boolean {
  return used + BigInt(additionalSize) > limit;
}

/**
 * Calculate time until bandwidth reset
 */
export function getTimeUntilBandwidthReset(bandwidthReset: Date): {
  hours: number;
  minutes: number;
  seconds: number;
} {
  const now = new Date();
  const diff = bandwidthReset.getTime() - now.getTime();

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

/**
 * Check if bandwidth should be reset
 */
export function shouldResetBandwidth(bandwidthReset: Date): boolean {
  return new Date() >= bandwidthReset;
}

/**
 * Get next bandwidth reset time (daily at midnight UTC)
 */
export function getNextBandwidthReset(): Date {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0) // Midnight UTC
  return tomorrow
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): { valid: boolean; error?: string } {
  if (size > STORAGE_LIMITS.FILE_SIZE_LIMIT) {
    return {
      valid: false,
      error: `File size exceeds the maximum limit of ${formatBytes(STORAGE_LIMITS.FILE_SIZE_LIMIT)}`,
    };
  }
  return { valid: true };
}

/**
 * Check if item should be permanently deleted from trash
 */
export function shouldPermanentlyDelete(deletedAt: Date): boolean {
  const now = new Date();
  const daysSinceDeleted = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceDeleted >= STORAGE_LIMITS.TRASH_RETENTION_DAYS;
}

/**
 * Validate file size
 */
export function validateFileSize(size: number): { valid: boolean; error?: string } {
  if (size > STORAGE_LIMITS.FILE_SIZE_LIMIT) {
    return {
      valid: false,
      error: `File size exceeds the maximum limit of ${formatBytes(STORAGE_LIMITS.FILE_SIZE_LIMIT)}`,
    };
  }
  return { valid: true };
}

/**
 * Check if item should be permanently deleted from trash
 */
export function shouldPermanentlyDelete(deletedAt: Date): boolean {
  const now = new Date();
  const daysSinceDeleted = Math.floor((now.getTime() - deletedAt.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceDeleted >= STORAGE_LIMITS.TRASH_RETENTION_DAYS;
}
