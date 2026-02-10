/**
 * Input sanitization utilities for Drive
 * Prevents XSS and injection attacks
 */

/**
 * Sanitize HTML entities to prevent XSS
 */
export function sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') return ''

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize user input text
 */
export function sanitizeText(input: string, maxLength: number = 1000): string {
    if (!input || typeof input !== 'string') return ''

    return input
        .trim()
        .slice(0, maxLength)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
}

/**
 * Sanitize folder/file name
 */
export function sanitizeName(name: string): string {
    if (!name || typeof name !== 'string') return ''

    return name
        .trim()
        .slice(0, 255)
        // Remove problematic characters
        .replace(/[<>:"\/\\|?*\x00-\x1F]/g, '')
        // Collapse multiple spaces
        .replace(/\s+/g, ' ')
}

/**
 * Sanitize file description
 */
export function sanitizeDescription(description: string): string {
    if (!description || typeof description !== 'string') return ''

    return sanitizeText(description, 2000)
}

/**
 * Sanitize tags array
 */
export function sanitizeTags(tags: string[] | string): string[] {
    if (!tags) return []

    // Handle JSON string
    if (typeof tags === 'string') {
        try {
            tags = JSON.parse(tags)
        } catch {
            return []
        }
    }

    if (!Array.isArray(tags)) return []

    return tags
        .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
        .map(tag => sanitizeText(tag, 50))
        .slice(0, 20) // Max 20 tags
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') return ''

    return sanitizeText(query, 200)
        // Remove SQL injection attempts (single quote, semicolon, double dash)
        .replace(/[';\-]{2}/g, '')
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url: string): { valid: boolean; sanitized?: string; error?: string } {
    if (!url || typeof url !== 'string') {
        return { valid: false, error: 'URL is required' }
    }

    try {
        const parsed = new URL(url)

        // Only allow http and https
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' }
        }

        return {
            valid: true,
            sanitized: parsed.toString()
        }
    } catch {
        return { valid: false, error: 'Invalid URL format' }
    }
}
