import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DuplicateFile {
  id: string;
  originalName: string;
  fileSize: bigint;
  fileHash: string;
  isDuplicate: boolean;
  duplicateType: 'exact' | 'name' | 'none';
  existingFileId?: string;
}

/**
 * Detect duplicate files when importing
 */
export async function detectDuplicates(
  targetDriveId: string,
  files: Array<{ name: string; hash: string; size: bigint }>
): Promise<DuplicateFile[]> {
  try {
    // Get all files in target drive
    const existingFiles = await prisma.driveFile.findMany({
      where: {
        driveId: targetDriveId,
        deletedAt: null,
      },
      select: {
        id: true,
        originalName: true,
        fileHash: true,
        fileSize: true,
      },
    });

    // Create a map for quick lookup
    const hashMap = new Map(existingFiles.map((f) => [f.fileHash, f]));
    const nameMap = new Map(existingFiles.map((f) => [f.originalName.toLowerCase(), f]));

    // Check each file for duplicates
    return files.map((file, index) => {
      const existingByHash = hashMap.get(file.hash);
      const existingByName = nameMap.get(file.name.toLowerCase());

      if (existingByHash) {
        // Exact duplicate (same hash)
        return {
          id: `temp-${index}`,
          originalName: file.name,
          fileSize: file.size,
          fileHash: file.hash,
          isDuplicate: true,
          duplicateType: 'exact' as const,
          existingFileId: existingByHash.id,
        };
      } else if (existingByName && existingByName.fileHash !== file.hash) {
        // Same name but different content
        return {
          id: `temp-${index}`,
          originalName: file.name,
          fileSize: file.size,
          fileHash: file.hash,
          isDuplicate: true,
          duplicateType: 'name' as const,
          existingFileId: existingByName.id,
        };
      } else {
        // No duplicate
        return {
          id: `temp-${index}`,
          originalName: file.name,
          fileSize: file.size,
          fileHash: file.hash,
          isDuplicate: false,
          duplicateType: 'none' as const,
        };
      }
    });
  } catch (error) {
    console.error('Error detecting duplicates:', error);
    throw new Error('Failed to detect duplicates');
  }
}

/**
 * Check if a single file is a duplicate
 */
export async function checkFileDuplicate(
  driveId: string,
  fileName: string,
  fileHash: string
): Promise<{
  isDuplicate: boolean;
  duplicateType: 'exact' | 'name' | 'none';
  existingFile?: any;
}> {
  try {
    // Check for exact hash match
    const exactMatch = await prisma.driveFile.findFirst({
      where: {
        driveId,
        fileHash,
        deletedAt: null,
      },
    });

    if (exactMatch) {
      return {
        isDuplicate: true,
        duplicateType: 'exact',
        existingFile: exactMatch,
      };
    }

    // Check for name match with different hash
    const nameMatch = await prisma.driveFile.findFirst({
      where: {
        driveId,
        originalName: fileName,
        deletedAt: null,
        NOT: {
          fileHash,
        },
      },
    });

    if (nameMatch) {
      return {
        isDuplicate: true,
        duplicateType: 'name',
        existingFile: nameMatch,
      };
    }

    return {
      isDuplicate: false,
      duplicateType: 'none',
    };
  } catch (error) {
    console.error('Error checking file duplicate:', error);
    throw new Error('Failed to check file duplicate');
  }
}
