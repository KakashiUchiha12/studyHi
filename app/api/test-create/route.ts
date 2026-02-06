
import { NextRequest, NextResponse } from 'next/server'
import { dbService } from '@/lib/database'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        console.log("Test Session:", JSON.stringify(session, null, 2))
        const instructorId = "cml5dgg4z0000mv1inayh4ukr"; // Valid user ID from DB
        const courseData = {
            title: "Test Course " + Date.now(),
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

        return NextResponse.json({ success: true, courseId: newCourse.id, session });
    } catch (error: any) {
        const fs = require('fs');
        fs.writeFileSync('d:\\Development_3rd_Feb\\test-create-error.json', JSON.stringify({
            message: error.message,
            stack: error.stack,
            name: error.constructor.name,
            prismaError: error instanceof Error ? error.constructor.name : typeof error
        }, null, 2));
        console.error("Test creation failed:", error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack,
            prismaError: error instanceof Error ? error.constructor.name : typeof error
        }, { status: 500 });
    }
}
