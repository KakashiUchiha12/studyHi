import Papa from "papaparse";

export interface ParsedLesson {
    title: string;
    contentType: "video" | "text" | "quiz" | "file";
    videoUrl?: string;
    imageUrl?: string;
    description?: string;
}

export interface ParsedChapter {
    title: string;
    lessons: ParsedLesson[];
}

export interface ParsedModule {
    title: string;
    chapters: ParsedChapter[];
}

export interface CourseParseResult {
    success: boolean;
    modules: ParsedModule[];
    errors: string[];
    warnings: string[];
}

export function parseCourseCSV(csvText: string): CourseParseResult {
    const result: CourseParseResult = {
        success: false,
        modules: [],
        errors: [],
        warnings: [],
    };

    if (!csvText || !csvText.trim()) {
        result.errors.push("CSV content is empty");
        return result;
    }

    const parse = Papa.parse(csvText.trim(), {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });

    if (parse.errors.length > 0) {
        result.errors = parse.errors.map((e) => `Row ${e.row}: ${e.message}`);
        return result;
    }

    const rows = parse.data as any[];

    // Normalize headers (lowercase, remove spaces) for easier matching
    // Expected headers: "Module Title", "Chapter Title", "Lesson Title", "Content Type", "Video URL", "Image URL", "Description"

    let currentModule: ParsedModule | null = null;
    let currentChapter: ParsedChapter | null = null;

    rows.forEach((row, index) => {
        const rowNum = index + 2; // +1 for 0-index, +1 for header

        // Flexible header access helper
        const getVal = (keys: string[]) => {
            // 1. Try exact keys
            for (const key of keys) {
                if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
                    return String(row[key]).trim();
                }
            }
            // 2. Try case insensitive / trimmed keys in the row object
            const rowKeys = Object.keys(row);
            for (const key of keys) {
                const normalizedKey = key.toLowerCase().replace(/\s/g, '');
                const match = rowKeys.find(rk => rk.toLowerCase().replace(/\s/g, '') === normalizedKey);
                if (match && row[match] !== undefined && row[match] !== null && String(row[match]).trim() !== "") {
                    return String(row[match]).trim();
                }
            }
            return null;
        };

        const moduleTitle = getVal(["Module Title", "Module", "Module Name"]);
        const chapterTitle = getVal(["Chapter Title", "Chapter", "Chapter Name"]);
        const lessonTitle = getVal(["Lesson Title", "Lesson", "Section Title", "Section", "Video Title", "Title"]);
        const contentType = getVal(["Content Type", "Type"]) || "video";
        // Sanitize Video URL (fix double ? issue from AI)
        const cleanVideoUrl = (url: string) => {
            if (!url) return undefined;
            // Handle multiple ? symbols by converting subsequent ones to &
            const parts = url.split('?');
            if (parts.length > 2) {
                return parts[0] + '?' + parts.slice(1).join('&');
            }
            return url;
        };

        const videoUrlRaw = getVal(["Video URL", "Video Link", "URL", "Link"]);
        const videoUrl = cleanVideoUrl(videoUrlRaw ? String(videoUrlRaw) : "");

        const description = getVal(["Description", "Desc", "Summary"]);
        const imageUrlVal = getVal(["Image URL", "Thumbnail", "Image", "Cover"]);
        const imageUrl = imageUrlVal ? String(imageUrlVal) : undefined;

        // If strictly empty row after parsing
        if (!moduleTitle && !chapterTitle && !lessonTitle) return;

        // Logic: 
        // New Module if moduleTitle is present AND different from current
        // New Chapter if chapterTitle is present AND (different OR new module)

        // Handle Module
        if (moduleTitle && (!currentModule || currentModule.title !== moduleTitle)) {
            currentModule = {
                title: String(moduleTitle),
                chapters: []
            };
            result.modules.push(currentModule);
            currentChapter = null; // Reset chapter on new module
        }

        // Fallback: If no module yet, create a "General" one
        if (!currentModule) {
            currentModule = { title: "General", chapters: [] };
            result.modules.push(currentModule);
        }

        // Handle Chapter
        if (chapterTitle && (!currentChapter || currentChapter.title !== chapterTitle)) {
            currentChapter = {
                title: String(chapterTitle),
                lessons: []
            };
            currentModule.chapters.push(currentChapter);
        }

        // Fallback: If no chapter yet, create a "General" one
        if (!currentChapter) {
            currentChapter = { title: currentModule.title || "General", lessons: [] };
            currentModule.chapters.push(currentChapter);
        }



        // Handle Lesson
        if (lessonTitle) {
            const lesson: ParsedLesson = {
                title: String(lessonTitle),
                contentType: String(contentType).toLowerCase() as any,
                videoUrl: videoUrl,
                imageUrl: imageUrl,
                description: description ? String(description) : undefined,
            };

            // Basic Validation
            if (!["video", "text", "file", "quiz"].includes(lesson.contentType)) {
                result.warnings.push(`Row ${rowNum}: Invalid content type '${lesson.contentType}', defaulting to 'video'.`);
                lesson.contentType = "video";
            }

            currentChapter.lessons.push(lesson);
        } else {
            result.warnings.push(`Row ${rowNum}: Skipping row with no Lesson Title.`);
        }
    });

    if (result.modules.length > 0) {
        result.success = true;
    } else {
        result.errors.push("No valid modules found.");
    }

    return result;
}
