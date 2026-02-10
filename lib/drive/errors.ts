/**
 * Structured error handling for Drive
 */

export class DriveError extends Error {
    constructor(
        public code: string,
        public message: string,
        public status: number = 500,
        public details?: any
    ) {
        super(message)
        this.name = 'DriveError'
    }

    toJSON() {
        return {
            error: this.message,
            code: this.code,
            details: this.details
        }
    }
}

export const ErrorCodes = {
    // Storage errors
    STORAGE_EXCEEDED: 'STORAGE_EXCEEDED',
    BANDWIDTH_EXCEEDED: 'BANDWIDTH_EXCEEDED',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',

    // Resource errors
    DRIVE_NOT_FOUND: 'DRIVE_NOT_FOUND',
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    FOLDER_NOT_FOUND: 'FOLDER_NOT_FOUND',

    // Permission errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_OWNER: 'NOT_OWNER',

    // Validation errors
    INVALID_INPUT: 'INVALID_INPUT',
    INVALID_PATH: 'INVALID_PATH',
    INVALID_NAME: 'INVALID_NAME',
    INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',

    // Operation errors
    DUPLICATE_FOUND: 'DUPLICATE_FOUND',
    OPERATION_FAILED: 'OPERATION_FAILED',
    TRANSACTION_FAILED: 'TRANSACTION_FAILED',

    // Rate limiting
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
}

// Pre-defined errors
export const DriveErrors = {
    storageExceeded: (used: string, limit: string) =>
        new DriveError(
            ErrorCodes.STORAGE_EXCEEDED,
            `Storage limit exceeded. Using ${used} of ${limit}`,
            403,
            { used, limit }
        ),

    bandwidthExceeded: (resetTime: Date) =>
        new DriveError(
            ErrorCodes.BANDWIDTH_EXCEEDED,
            `Bandwidth limit exceeded. Resets at ${resetTime.toISOString()}`,
            429,
            { resetTime }
        ),

    fileTooLarge: (size: number, limit: number) =>
        new DriveError(
            ErrorCodes.FILE_TOO_LARGE,
            `File size ${size} bytes exceeds limit of ${limit} bytes`,
            400,
            { size, limit }
        ),

    driveNotFound: () =>
        new DriveError(
            ErrorCodes.DRIVE_NOT_FOUND,
            'Drive not found for this user',
            404
        ),

    fileNotFound: (id?: string) =>
        new DriveError(
            ErrorCodes.FILE_NOT_FOUND,
            id ? `File not found: ${id}` : 'File not found',
            404,
            { fileId: id }
        ),

    folderNotFound: (id?: string) =>
        new DriveError(
            ErrorCodes.FOLDER_NOT_FOUND,
            id ? `Folder not found: ${id}` : 'Folder not found',
            404,
            { folderId: id }
        ),

    unauthorized: () =>
        new DriveError(
            ErrorCodes.UNAUTHORIZED,
            'Authentication required',
            401
        ),

    forbidden: (action?: string) =>
        new DriveError(
            ErrorCodes.FORBIDDEN,
            action ? `You don't have permission to ${action}` : 'Access denied',
            403,
            { action }
        ),

    notOwner: () =>
        new DriveError(
            ErrorCodes.NOT_OWNER,
            'You do not own this resource',
            403
        ),

    invalidInput: (field: string, reason: string) =>
        new DriveError(
            ErrorCodes.INVALID_INPUT,
            `Invalid ${field}: ${reason}`,
            400,
            { field, reason }
        ),

    invalidPath: (path: string, reason: string) =>
        new DriveError(
            ErrorCodes.INVALID_PATH,
            `Invalid path "${path}": ${reason}`,
            400,
            { path, reason }
        ),

    invalidName: (name: string, reason: string) =>
        new DriveError(
            ErrorCodes.INVALID_NAME,
            `Invalid name "${name}": ${reason}`,
            400,
            { name, reason }
        ),

    invalidFileType: (type: string) =>
        new DriveError(
            ErrorCodes.INVALID_FILE_TYPE,
            `File type not allowed: ${type}`,
            400,
            { type }
        ),

    duplicateFound: (hash: string) =>
        new DriveError(
            ErrorCodes.DUPLICATE_FOUND,
            'A file with this content already exists',
            409,
            { hash }
        ),

    operationFailed: (operation: string, reason?: string) =>
        new DriveError(
            ErrorCodes.OPERATION_FAILED,
            reason ? `${operation} failed: ${reason}` : `${operation} failed`,
            500,
            { operation, reason }
        ),

    rateLimitExceeded: (operation: string, resetTime: Date) =>
        new DriveError(
            ErrorCodes.RATE_LIMIT_EXCEEDED,
            `Too many ${operation} requests. Please try again later.`,
            429,
            { operation, resetTime }
        ),
}
