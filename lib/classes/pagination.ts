export interface PaginationOptions {
    limit?: number
    cursor?: string
}

export interface PaginatedResponse<T> {
    items: T[]
    nextCursor?: string
    hasMore: boolean
    total?: number
}

export interface CursorPagination {
    take: number
    skip?: number
    cursor?: {
        id: string
    }
}

/**
 * Creates Prisma cursor pagination options
 */
export function createPaginationOptions(
    limit: number = 20,
    cursor?: string
): CursorPagination {
    const pagination: CursorPagination = {
        take: limit + 1, // Take one extra to check if there are more
    }

    if (cursor) {
        pagination.skip = 1 // Skip the cursor itself
        pagination.cursor = { id: cursor }
    }

    return pagination
}

/**
 * Formats paginated results
 */
export function formatPaginatedResponse<T extends { id: string }>(
    items: T[],
    limit: number
): PaginatedResponse<T> {
    const hasMore = items.length > limit
    const resultItems = hasMore ? items.slice(0, limit) : items
    const nextCursor = hasMore ? resultItems[resultItems.length - 1]?.id : undefined

    return {
        items: resultItems,
        nextCursor,
        hasMore,
    }
}

/**
 * Creates pagination query parameters for API calls
 */
export function createPaginationParams(limit: number = 20, cursor?: string): URLSearchParams {
    const params = new URLSearchParams()
    params.set('limit', limit.toString())
    if (cursor) {
        params.set('cursor', cursor)
    }
    return params
}
