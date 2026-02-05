/**
 * CSV Task Parser Utility
 * Parses CSV text into task objects for bulk import
 */

export interface ParsedTask {
    title: string;
    description?: string;
    dueDate?: Date;
    priority?: 'low' | 'medium' | 'high';
    status?: 'pending' | 'in-progress' | 'completed';
    subject?: string;
}

export interface CSVParseResult {
    success: boolean;
    tasks: ParsedTask[];
    errors: string[];
    warnings: string[];
}

const EXPECTED_HEADERS = ['Title', 'Description', 'Due Date', 'Priority', 'Status', 'Subject'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUSES = ['pending', 'in-progress', 'completed'];

/**
 * Parse CSV text into task objects
 */
export function parseTasksCSV(csvText: string): CSVParseResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const tasks: ParsedTask[] = [];

    try {
        // Split into lines and filter empty lines
        const lines = csvText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lines.length === 0) {
            return {
                success: false,
                tasks: [],
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
            return { success: false, tasks: [], errors, warnings };
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

                const task = parseTaskRow(values, lineNumber, errors, warnings);
                if (task) {
                    tasks.push(task);
                }
            } catch (error) {
                errors.push(`Line ${lineNumber}: Failed to parse - ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return {
            success: errors.length === 0 && tasks.length > 0,
            tasks,
            errors,
            warnings,
        };
    } catch (error) {
        return {
            success: false,
            tasks: [],
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
 * Parse a single task row
 */
function parseTaskRow(
    values: string[],
    lineNumber: number,
    errors: string[],
    warnings: string[]
): ParsedTask | null {
    const [title, description, dueDateStr, priority, status, subject] = values;

    // Validate required fields
    if (!title || title.trim() === '') {
        errors.push(`Line ${lineNumber}: Title is required`);
        return null;
    }

    const task: ParsedTask = {
        title: title.trim(),
    };

    // Optional description
    if (description && description.trim()) {
        task.description = description.trim();
    }

    // Optional due date
    if (dueDateStr && dueDateStr.trim()) {
        const dueDate = parseDateString(dueDateStr.trim());
        if (dueDate) {
            task.dueDate = dueDate;
        } else {
            warnings.push(`Line ${lineNumber}: Invalid date format '${dueDateStr}' (expected YYYY-MM-DD)`);
        }
    }

    // Optional priority
    if (priority && priority.trim()) {
        const priorityLower = priority.trim().toLowerCase() as 'low' | 'medium' | 'high';
        if (VALID_PRIORITIES.includes(priorityLower)) {
            task.priority = priorityLower;
        } else {
            warnings.push(`Line ${lineNumber}: Invalid priority '${priority}' (valid: ${VALID_PRIORITIES.join(', ')}). Using default 'medium'`);
            task.priority = 'medium';
        }
    }

    // Optional status
    if (status && status.trim()) {
        const statusLower = status.trim().toLowerCase() as 'pending' | 'in-progress' | 'completed';
        if (VALID_STATUSES.includes(statusLower)) {
            task.status = statusLower;
        } else {
            warnings.push(`Line ${lineNumber}: Invalid status '${status}' (valid: ${VALID_STATUSES.join(', ')}). Using default 'pending'`);
            task.status = 'pending';
        }
    }

    // Optional subject
    if (subject && subject.trim()) {
        task.subject = subject.trim();
    }

    return task;
}

/**
 * Parse date string (YYYY-MM-DD format)
 */
function parseDateString(dateStr: string): Date | null {
    // Match YYYY-MM-DD format
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return null;
    }

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    // Validate ranges
    if (month < 1 || month > 12 || day < 1 || day > 31) {
        return null;
    }

    const date = new Date(year, month - 1, day);

    // Check if date is valid (handles invalid dates like Feb 30)
    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return null;
    }

    return date;
}

/**
 * Get sample CSV text for download/reference
 */
export function getSampleCSV(): string {
    return `Title,Description,Due Date,Priority,Status,Subject
Complete Chapter 5,Read and summarize calculus chapter 5,2024-01-20,high,pending,Math
Practice Problems,Solve exercise set 1-20,2024-01-22,medium,pending,Math
Lab Report,Write physics lab report on motion,2024-01-25,high,in-progress,Physics
Study for Midterm,Review all chapters for upcoming exam,2024-01-30,high,pending,Chemistry
Assignment 3,Complete programming assignment,2024-01-18,medium,pending,Computer Science`;
}
