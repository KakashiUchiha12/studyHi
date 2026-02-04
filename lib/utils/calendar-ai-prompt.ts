/**
 * AI Prompt Template for CSV Calendar Event Generation
 */

export const CSV_CALENDAR_PROMPT = `I need help creating a study timetable. Please generate a CSV file in the following exact format:

**CSV Format Requirements:**
Header Row (must be exactly): Title,Description,Start Time,End Time,Type,Color

**Field Details:**
- Title: Event name (REQUIRED)
- Description: Details about the event (optional)
- Start Time: ISO format (YYYY-MM-DDTHH:mm:ss) or clear date time (YYYY-MM-DD HH:mm) (REQUIRED)
- End Time: ISO format (YYYY-MM-DDTHH:mm:ss) or clear date time (YYYY-MM-DD HH:mm) (REQUIRED)
- Type: One of: study, exam, assignment, personal, other (defaults to 'study')
- Color: Hex color code (e.g., #3b82f6 for blue) or generic name (blue, red, green) (optional)

**Example CSV:**
\`\`\`
Title,Description,Start Time,End Time,Type,Color
Math Study,Calculus Chapter 5,2024-01-20 10:00,2024-01-20 12:00,study,#3b82f6
Lunch Break,Time to eat,2024-01-20 12:00,2024-01-20 13:00,personal,#10b981
Physics Lab,Motion experiments,2024-01-20 14:00,2024-01-20 16:00,assignment,#f59e0b
\`\`\`

**IMPORTANT:**
1. Start with the exact header row
2. Use valid date-time formats
3. Ensure End Time is after Start Time

**My Request:**
Please create a timetable for: [ADD YOUR REQUEST HERE - e.g., "A study plan for next week aiming for 4 hours of math daily"]`;

/**
 * Copy the AI prompt to clipboard
 */
export async function copyCalendarAIPromptToClipboard(): Promise<boolean> {
    try {
        // Try accessing the clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(CSV_CALENDAR_PROMPT);
            return true;
        }
        throw new Error('Clipboard API not available');
    } catch (error) {
        // Fallback for non-secure contexts (like HTTP on local network)
        try {
            const textArea = document.createElement("textarea");
            textArea.value = CSV_CALENDAR_PROMPT;

            // Ensure it's not visible but part of the DOM
            textArea.style.position = "fixed";
            textArea.style.left = "-9999px";
            textArea.style.top = "0";
            document.body.appendChild(textArea);

            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            return successful;
        } catch (fallbackError) {
            console.error('Failed to copy to clipboard:', fallbackError);
            return false;
        }
    }
}

/**
 * Download sample CSV file
 */
export function downloadSampleCalendarCSV(): void {
    const sampleCSV = `Title,Description,Start Time,End Time,Type,Color
Math Study,Calculus Chapter 5,2024-01-20 10:00,2024-01-20 12:00,study,#3b82f6
Lunch Break,Time to eat,2024-01-20 12:00,2024-01-20 13:00,personal,#10b981
Physics Lab,Motion experiments,2024-01-20 14:00,2024-01-20 16:00,assignment,#f59e0b`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-timetable.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
