/**
 * Quiz CSV Parser Utility
 */

export interface ParsedQuizQuestion {
    question: string;
    options: string[];
    correctAnswers: string[];
    explanation?: string;
}

export interface QuizCSVParseResult {
    success: boolean;
    questions: ParsedQuizQuestion[];
    errors: string[];
    warnings: string[];
}

const EXPECTED_HEADERS = ['Question', 'Options', 'Correct Answers', 'Explanation'];

/**
 * Parse CSV text into quiz question objects
 */
export function parseQuizCSV(csvText: string): QuizCSVParseResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const questions: ParsedQuizQuestion[] = [];

    try {
        const lines = csvText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lines.length === 0) {
            return {
                success: false,
                questions: [],
                errors: ['CSV is empty'],
                warnings: [],
            };
        }

        // Parse header
        const headers = parseCSVLine(lines[0]);

        // Validate headers (case-insensitive for robustness)
        const headerMatch = headers.every((h, i) =>
            h.toLowerCase() === EXPECTED_HEADERS[i].toLowerCase()
        );

        if (!headerMatch || headers.length < 3) {
            errors.push(`Invalid CSV headers. Expected: ${EXPECTED_HEADERS.join(', ')}`);
            return { success: false, questions: [], errors, warnings };
        }

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            const lineNumber = i + 1;
            const line = lines[i];

            try {
                const values = parseCSVLine(line);

                if (values.length < 3) {
                    warnings.push(`Line ${lineNumber}: Missing required columns (Question, Options, Correct Answers)`);
                    continue;
                }

                const question = parseQuizRow(values, lineNumber, errors, warnings);
                if (question) {
                    questions.push(question);
                }
            } catch (error) {
                errors.push(`Line ${lineNumber}: Failed to parse - ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return {
            success: errors.length === 0 && questions.length > 0,
            questions,
            errors,
            warnings,
        };
    } catch (error) {
        return {
            success: false,
            questions: [],
            errors: [`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`],
            warnings: [],
        };
    }
}

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

function parseQuizRow(
    values: string[],
    lineNumber: number,
    errors: string[],
    warnings: string[]
): ParsedQuizQuestion | null {
    const [qText, optionsStr, correctStr, explanation] = values;

    if (!qText || qText.trim() === '') {
        errors.push(`Line ${lineNumber}: Question text is required`);
        return null;
    }

    if (!optionsStr || optionsStr.trim() === '') {
        errors.push(`Line ${lineNumber}: Options are required`);
        return null;
    }

    if (!correctStr || correctStr.trim() === '') {
        errors.push(`Line ${lineNumber}: Correct answer(s) are required`);
        return null;
    }

    const options = optionsStr.split('|').map(o => o.trim()).filter(Boolean);
    const correctAnswers = correctStr.split('|').map(o => o.trim()).filter(Boolean);

    // Validate that correct answers exist in options
    const invalidAnswers = correctAnswers.filter(ca => !options.includes(ca));
    if (invalidAnswers.length > 0) {
        warnings.push(`Line ${lineNumber}: Correct answer(s) [${invalidAnswers.join(', ')}] not found in options list`);
    }

    return {
        question: qText.trim(),
        options,
        correctAnswers,
        explanation: explanation?.trim() || ''
    };
}
