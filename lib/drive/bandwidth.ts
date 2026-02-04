import { PrismaClient } from '@prisma/client';
import {
  shouldResetBandwidth,
  getNextBandwidthReset,
  isBandwidthLimitExceeded,
} from './storage';

const prisma = new PrismaClient();

/**
 * Track bandwidth usage for a download
 */
export async function trackBandwidth(
  userId: string,
  fileSize: number
): Promise<{ allowed: boolean; error?: string; resetTime?: Date }> {
  try {
    const drive = await prisma.drive.findUnique({
      where: { userId },
    });

    if (!drive) {
      return { allowed: false, error: 'Drive not found' };
    }

    // Check if bandwidth needs to be reset
    if (shouldResetBandwidth(drive.bandwidthReset)) {
      // Reset bandwidth
      await prisma.drive.update({
        where: { userId },
        data: {
          bandwidthUsed: BigInt(fileSize),
          bandwidthReset: getNextBandwidthReset(),
        },
      });
      return { allowed: true };
    }

    // Check if bandwidth limit would be exceeded
    if (isBandwidthLimitExceeded(drive.bandwidthUsed, drive.bandwidthLimit, fileSize)) {
      return {
        allowed: false,
        error: 'Daily bandwidth limit exceeded',
        resetTime: drive.bandwidthReset,
      };
    }

    // Update bandwidth usage
    await prisma.drive.update({
      where: { userId },
      data: {
        bandwidthUsed: drive.bandwidthUsed + BigInt(fileSize),
      },
    });

    return { allowed: true };
  } catch (error) {
    console.error('Error tracking bandwidth:', error);
    return { allowed: false, error: 'Failed to track bandwidth' };
  }
}

/**
 * Get current bandwidth status
 */
export async function getBandwidthStatus(userId: string): Promise<{
  used: bigint;
  limit: bigint;
  resetTime: Date;
  percentage: number;
} | null> {
  try {
    const drive = await prisma.drive.findUnique({
      where: { userId },
      select: {
        bandwidthUsed: true,
        bandwidthLimit: true,
        bandwidthReset: true,
      },
    });

    if (!drive) return null;

    // Check if bandwidth needs to be reset
    if (shouldResetBandwidth(drive.bandwidthReset)) {
      await prisma.drive.update({
        where: { userId },
        data: {
          bandwidthUsed: BigInt(0),
          bandwidthReset: getNextBandwidthReset(),
        },
      });

      return {
        used: BigInt(0),
        limit: drive.bandwidthLimit,
        resetTime: getNextBandwidthReset(),
        percentage: 0,
      };
    }

    const percentage = Number((drive.bandwidthUsed * BigInt(100)) / drive.bandwidthLimit);

    return {
      used: drive.bandwidthUsed,
      limit: drive.bandwidthLimit,
      resetTime: drive.bandwidthReset,
      percentage,
    };
  } catch (error) {
    console.error('Error getting bandwidth status:', error);
    return null;
  }
}

/**
 * Reset bandwidth for a user (manual reset)
 */
export async function resetBandwidth(userId: string): Promise<boolean> {
  try {
    await prisma.drive.update({
      where: { userId },
      data: {
        bandwidthUsed: BigInt(0),
        bandwidthReset: getNextBandwidthReset(),
      },
    });
    return true;
  } catch (error) {
    console.error('Error resetting bandwidth:', error);
    return false;
  }
}
