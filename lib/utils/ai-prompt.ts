/**
 * AI Prompt Template for CSV Task Generation
 */

export const CSV_TASK_PROMPT = `I need help creating tasks for my study planner. Please generate a CSV file in the following exact format:

**CSV Format Requirements:**
Header Row (must be exactly): Title,Description,Due Date,Priority,Status,Subject

**Field Details:**
- Title: Task name (REQUIRED - cannot be empty)
- Description: Detailed description of the task (optional, can be empty)
- Due Date: Format YYYY-MM-DD, example: 2024-01-20 (optional, leave empty if no due date)
- Priority: Must be one of: low, medium, high (optional, defaults to medium if empty)
- Status: Must be one of: pending, in-progress, completed (optional, defaults to pending if empty)
- Subject: Subject name like "Math", "Physics", "Chemistry", etc. (optional)

**Example CSV:**
\`\`\`
Title,Description,Due Date,Priority,Status,Subject
Complete Chapter 5,Read and summarize calculus chapter 5,2024-01-20,high,pending,Math
Practice Problems,Solve exercise set 1-20,2024-01-22,medium,pending,Math
Lab Report,Write physics lab report on motion,2024-01-25,high,in-progress,Physics
Study for Midterm,Review all chapters for upcoming exam,2024-01-30,high,pending,Chemistry
\`\`\`

**IMPORTANT:**
1. Start with the exact header row: Title,Description,Due Date,Priority,Status,Subject
2. Each task must have a Title
3. Use YYYY-MM-DD format for dates (e.g., 2024-01-15)
4. Priority can only be: low, medium, or high
5. Status can only be: pending, in-progress, or completed
6. If a field is optional and empty, just leave it blank (don't write "empty" or "N/A")

**My Request:**
Please create tasks for: [ADD YOUR SPECIFIC REQUEST HERE - e.g., "10 math homework tasks for calculus" or "5 study tasks for biology exam preparation"]`;

/**
 * Copy the AI prompt to clipboard
 */
export async function copyAIPromptToClipboard(): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(CSV_TASK_PROMPT);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}

/**
 * Download sample CSV file
 */
export function downloadSampleCSV(): void {
    const sampleCSV = `Title,Description,Due Date,Priority,Status,Subject
Complete Chapter 5,Read and summarize calculus chapter 5,2024-01-20,high,pending,Math
Practice Problems,Solve exercise set 1-20,2024-01-22,medium,pending,Math
Lab Report,Write physics lab report on motion,2024-01-25,high,in-progress,Physics
Study for Midterm,Review all chapters for upcoming exam,2024-01-30,high,pending,Chemistry
Assignment 3,Complete programming assignment,2024-01-18,medium,pending,Computer Science`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample-tasks.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
