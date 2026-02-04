import crypto from 'crypto';
import fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);

/**
 * Calculate MD5 hash of a file
 */
export async function calculateFileMD5(filePath: string): Promise<string> {
  try {
    const fileBuffer = await readFile(filePath);
    const hash = crypto.createHash('md5');
    hash.update(fileBuffer);
    return hash.digest('hex');
  } catch (error) {
    console.error('Error calculating MD5 hash:', error);
    throw new Error('Failed to calculate file hash');
  }
}

/**
 * Calculate SHA256 hash of a file
 */
export async function calculateFileSHA256(filePath: string): Promise<string> {
  try {
    const fileBuffer = await readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    return hash.digest('hex');
  } catch (error) {
    console.error('Error calculating SHA256 hash:', error);
    throw new Error('Failed to calculate file hash');
  }
}

/**
 * Calculate hash from buffer
 */
export function calculateBufferHash(buffer: Buffer, algorithm: 'md5' | 'sha256' = 'md5'): string {
  const hash = crypto.createHash(algorithm);
  hash.update(buffer);
  return hash.digest('hex');
}

/**
 * Generate unique filename with hash
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const ext = originalName.substring(originalName.lastIndexOf('.'));
  return `${timestamp}-${randomString}${ext}`;
}
