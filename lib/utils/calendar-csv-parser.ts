/**
 * CSV Calendar Event Parser Utility
 * Parses CSV text into event objects for bulk import
 */

export interface ParsedCalendarEvent {
    title: string;
    description?: string;
    start: Date;
    end: Date;
    type?: 'study' | 'exam' | 'assignment' | 'personal' | 'other';
    color?: string;
}

export interface CSVParseResult {
    success: boolean;
    events: ParsedCalendarEvent[];
    errors: string[];
    warnings: string[];
}

const EXPECTED_HEADERS = ['Title', 'Description', 'Start Time', 'End Time', 'Type', 'Color'];
const VALID_TYPES = ['study', 'exam', 'assignment', 'personal', 'other'];

/**
 * Parse CSV text into calendar event objects
 */
export function parseCalendarCSV(csvText: string): CSVParseResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const events: ParsedCalendarEvent[] = [];

    try {
        // Split into lines and filter empty lines
        const lines = csvText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lines.length === 0) {
            return {
                success: false,
                events: [],
                errors: ['CSV is empty'],
                warnings: [],
            };
        }

        // Parse header
        const headerLine = lines[0];
        const headers = parseCSVLine(headerLine);

        // Validate headers
        if (!validateHeaders(headers)) {
            errors.push(
                `Invalid CSV headers. Expected: ${EXPECTED_HEADERS.join(', ')}`
            );
            return { success: false, events: [], errors, warnings };
        }

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            const lineNumber = i + 1;
            const line = lines[i];

            try {
                const values = parseCSVLine(line);

                if (values.length !== headers.length) {
                    warnings.push(`Line ${lineNumber}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
                    continue;
                }

                const event = parseEventRow(values, lineNumber, errors, warnings);
                if (event) {
                    events.push(event);
                }
            } catch (error) {
                errors.push(`Line ${lineNumber}: Failed to parse - ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return {
            success: errors.length === 0 && events.length > 0,
            events,
            errors,
            warnings,
        };
    } catch (error) {
        return {
            success: false,
            events: [],
            errors: [`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`],
            warnings: [],
        };
    }
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    values.push(current.trim());
    return values;
}

/**
 * Validate CSV headers
 */
function validateHeaders(headers: string[]): boolean {
    if (headers.length !== EXPECTED_HEADERS.length) {
        return false;
    }

    for (let i = 0; i < headers.length; i++) {
        if (headers[i] !== EXPECTED_HEADERS[i]) {
            return false;
        }
    }

    return true;
}

/**
 * Parse a single event row
 */
function parseEventRow(
    values: string[],
    lineNumber: number,
    errors: string[],
    warnings: string[]
): ParsedCalendarEvent | null {
    const [title, description, startStr, endStr, type, color] = values;

    // Validate required fields
    if (!title || title.trim() === '') {
        errors.push(`Line ${lineNumber}: Title is required`);
        return null;
    }

    if (!startStr) {
        errors.push(`Line ${lineNumber}: Start Time is required`);
        return null;
    }

    if (!endStr) {
        errors.push(`Line ${lineNumber}: End Time is required`);
        return null;
    }

    const start = parseDateString(startStr);
    const end = parseDateString(endStr);

    if (!start) {
        errors.push(`Line ${lineNumber}: Invalid Start Time format`);
        return null;
    }

    if (!end) {
        errors.push(`Line ${lineNumber}: Invalid End Time format`);
        return null;
    }

    if (end <= start) {
        warnings.push(`Line ${lineNumber}: End time is before start time`);
    }

    const event: ParsedCalendarEvent = {
        title: title.trim(),
        start,
        end,
    };

    // Optional description
    if (description && description.trim()) {
        event.description = description.trim();
    }

    // Optional type
    if (type && type.trim()) {
        const typeLower = type.trim().toLowerCase() as any;
        if (VALID_TYPES.includes(typeLower)) {
            event.type = typeLower;
        } else {
            warnings.push(`Line ${lineNumber}: Invalid type '${type}'. Using default 'study'`);
            event.type = 'study';
        }
    } else {
        event.type = 'study';
    }

    // Optional color
    if (color && color.trim()) {
        event.color = color.trim();
    }

    return event;
}

/**
 * Parse date string (ISO or custom format)
 */
function parseDateString(dateStr: string): Date | null {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
        return date;
    }
    return null;
}
