/**
 * Path validation and sanitization utilities for Drive
 * Prevents directory traversal and malicious path attacks
 */

export interface ValidationResult {
    valid: boolean
    sanitized?: string
    error?: string
}

/**
 * Validate and sanitize a path string
 */
export function validatePath(path: string): ValidationResult {
    if (!path || typeof path !== 'string') {
        return {
            valid: false,
            error: 'Path is required and must be a string'
        }
    }

    // Check for directory traversal attempts
    if (path.includes('..')) {
        return {
            valid: false,
            error: 'Path cannot contain directory traversal sequences (..)'
        }
    }

    // Check for absolute paths (should be relative)
    if (path.startsWith('/') || path.startsWith('\\')) {
        return {
            valid: false,
            error: 'Path must be relative, not absolute'
        }
    }

    // Check for null bytes (security risk)
    if (path.includes('\0')) {
        return {
            valid: false,
            error: 'Path cannot contain null bytes'
        }
    }

    // Validate characters - allow alphanumeric, spaces, hyphens, underscores, forward slashes
    const validPathRegex = /^[a-zA-Z0-9\s\-_\/\.]+$/
    if (!validPathRegex.test(path)) {
        return {
            valid: false,
            error: 'Path contains invalid characters. Only alphanumeric, spaces, hyphens, underscores, periods, and forward slashes allowed'
        }
    }

    // Check for consecutive slashes
    if (path.includes('//')) {
        return {
            valid: false,
            error: 'Path cannot contain consecutive slashes'
        }
    }

    // Sanitize: trim, normalize slashes
    const sanitized = path.trim().replace(/\\/g, '/')

    // Check max length (255 chars is common filesystem limit)
    if (sanitized.length > 255) {
        return {
            valid: false,
            error: 'Path exceeds maximum length of 255 characters'
        }
    }

    return {
        valid: true,
        sanitized
    }
}

/**
 * Validate a folder/file name (single component, not full path)
 */
export function validateName(name: string): ValidationResult {
    if (!name || typeof name !== 'string') {
        return {
            valid: false,
            error: 'Name is required and must be a string'
        }
    }

    // Trim whitespace
    const trimmed = name.trim()

    if (trimmed.length === 0) {
        return {
            valid: false,
            error: 'Name cannot be empty or whitespace only'
        }
    }

    // Check for path separators (should be single name)
    if (trimmed.includes('/') || trimmed.includes('\\')) {
        return {
            valid: false,
            error: 'Name cannot contain path separators'
        }
    }

    // Check for directory traversal
    if (trimmed.includes('..')) {
        return {
            valid: false,
            error: 'Name cannot contain directory traversal sequences'
        }
    }

    // Check for reserved names (Windows)
    const reserved = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
    if (reserved.includes(trimmed.toUpperCase())) {
        return {
            valid: false,
            error: 'Name is a reserved system name'
        }
    }

    // Check for invalid characters - more strict than path
    const validNameRegex = /^[a-zA-Z0-9\s\-_\.()]+$/
    if (!validNameRegex.test(trimmed)) {
        return {
            valid: false,
            error: 'Name contains invalid characters. Only alphanumeric, spaces, hyphens, underscores, periods, and parentheses allowed'
        }
    }

    // Check max length
    if (trimmed.length > 255) {
        return {
            valid: false,
            error: 'Name exceeds maximum length of 255 characters'
        }
    }

    return {
        valid: true,
        sanitized: trimmed
    }
}

/**
 * Build safe path from components
 */
export function buildPath(...components: string[]): string {
    return components
        .filter(c => c && c.length > 0)
        .map(c => c.trim())
        .join('/')
        .replace(/\/+/g, '/') // Remove consecutive slashes
        .replace(/^\//, '') // Remove leading slash
}
