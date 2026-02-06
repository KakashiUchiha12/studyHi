
import { dbService } from './lib/database/database-service.ts';

async function reproduce() {
    try {
        const instructorId = "cmlanmkv10006v5pkqq59yziu"; // Using the ID from the logs
        const courseData = {
            title: "Reproduction Course " + Date.now(),
            category: "Programming",
            description: "Test description",
            shortDescription: "Short test",
            difficulty: "beginner",
            language: "en"
        };

        const slugValue = courseData.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            + '-' + Date.now();

        console.log("Attempting to create course with slug:", slugValue);

        const newCourse = await dbService.getPrisma().course.create({
            data: {
                userId: instructorId,
                title: courseData.title,
                slug: slugValue,
                description: courseData.description,
                shortDescription: courseData.shortDescription,
                category: courseData.category,
                difficulty: courseData.difficulty,
                language: courseData.language,
                requirements: '[]',
                price: 0,
                currency: 'USD',
                isPaid: false,
                status: 'draft',
                isDraft: true
            }
        });

        console.log("Course created successfully:", newCourse.id);
    } catch (error) {
        console.error("Failed to create course:", error);
    } finally {
        await dbService.disconnect();
    }
}

reproduce();
