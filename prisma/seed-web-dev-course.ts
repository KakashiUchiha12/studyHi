import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding Web Development Course...')

    // First, create or find the instructor user (studyHi-Docbot)
    const instructor = await prisma.user.upsert({
        where: { email: 'docbot@studyhi.com' },
        update: {},
        create: {
            email: 'docbot@studyhi.com',
            name: 'studyHi-Docbot',
            passwordHash: '$2a$10$dummyHashForDocBot123456789012345678901234567890',
        },
    })

    console.log('✅ Instructor created:', instructor.name)

    const courseSlug = 'complete-web-development-bootcamp-2026'

    // Delete existing course data to ensure a clean seed if it exists
    const existingCourse = await prisma.course.findUnique({
        where: { slug: courseSlug },
        include: { modules: { include: { chapters: true } } }
    })

    if (existingCourse) {
        console.log('🗑️ Existing course found, updating data...')
        // We'll update the course and its related data
    }

    // Create or Update the main course
    const course = await prisma.course.upsert({
        where: { slug: courseSlug },
        update: {
            title: 'Complete Web Development Bootcamp 2026',
            description: `Master modern web development from scratch. Learn HTML, CSS, JavaScript, React, Node.js, and build real-world projects.

## What You'll Learn
- HTML5 & CSS3: Build beautiful, responsive websites
- JavaScript ES6+: Master modern JavaScript programming  
- React: Create dynamic single-page applications
- Node.js & Express: Build powerful backend APIs
- Database Design: Work with MongoDB and SQL
- Deployment: Launch your applications to the cloud`,
            shortDescription: 'Master modern web development from scratch with this comprehensive bootcamp',
            courseImage: '/uploads/courses/web-dev-course-card.jpg',
            category: 'Web Development',
            difficulty: 'beginner',
            language: 'en',
            learningObjectives: JSON.stringify([
                'Build responsive websites with HTML5 and CSS3',
                'Master JavaScript ES6+ features and async programming',
                'Create modern UIs with React and hooks',
                'Develop RESTful APIs with Node.js and Express',
                'Work with databases (MongoDB, PostgreSQL)',
                'Deploy applications to production'
            ]),
            requirements: JSON.stringify([
                'A computer (Windows, Mac, or Linux)',
                'Internet connection',
                'Enthusiasm to learn!'
            ]),
            price: 49.99,
            currency: 'USD',
            isPaid: true,
            status: 'published',
            isDraft: false,
            enrollmentCount: 1247,
            averageRating: 4.8,
            ratingCount: 342,
            publishedAt: new Date(),
        },
        create: {
            userId: instructor.id,
            title: 'Complete Web Development Bootcamp 2026',
            slug: courseSlug,
            description: `Master modern web development from scratch. Learn HTML, CSS, JavaScript, React, Node.js, and build real-world projects.`,
            shortDescription: 'Master modern web development from scratch with this comprehensive bootcamp',
            courseImage: '/uploads/courses/web-dev-course-card.jpg',
            category: 'Web Development',
            difficulty: 'beginner',
            language: 'en',
            price: 49.99,
            isPaid: true,
            status: 'published',
            isDraft: false,
        }
    })

    console.log('✅ Course upserted:', course.title)

    // Clear existing modules to avoid unique constraint issues during seed
    await prisma.courseModule.deleteMany({ where: { courseId: course.id } })

    // Module 1: HTML & CSS Fundamentals
    const module1 = await prisma.courseModule.create({
        data: {
            courseId: course.id,
            title: 'HTML & CSS Fundamentals',
            description: 'Learn the building blocks of web development',
            order: 0,
            duration: 600,
            moduleImage: '/uploads/courses/modules/html-css-module.jpg',
        },
    })

    const module1Chapter1 = await prisma.courseChapter.create({
        data: {
            moduleId: module1.id,
            title: 'HTML Basics',
            description: 'Introduction to HTML structure and elements',
            order: 0,
            duration: 120,
        },
    })

    await prisma.courseSection.createMany({
        data: [
            {
                chapterId: module1Chapter1.id,
                title: 'Introduction to HTML',
                contentType: 'video',
                content: `# Introduction to HTML

HTML (HyperText Markup Language) is the standard markup language for creating web pages.`,
                order: 0,
                duration: 15,
                sectionType: 'video',
                videoUrl: 'https://www.youtube.com/watch?v=qz0aGYrrlhU',
                isPreview: true,
            },
            {
                chapterId: module1Chapter1.id,
                title: 'HTML Document Structure',
                contentType: 'video',
                content: `# HTML Document Structure`,
                order: 1,
                duration: 20,
                sectionType: 'video',
                videoUrl: 'https://www.youtube.com/watch?v=UB1O30fR-EE',
                isPreview: false,
            },
        ],
    })

    const module1Chapter2 = await prisma.courseChapter.create({
        data: {
            moduleId: module1.id,
            title: 'CSS Styling',
            description: 'Learn to style your web pages with CSS',
            order: 1,
            duration: 150,
        },
    })

    await prisma.courseSection.createMany({
        data: [
            {
                chapterId: module1Chapter2.id,
                title: 'Introduction to CSS',
                contentType: 'video',
                content: `# Introduction to CSS`,
                order: 0,
                duration: 20,
                sectionType: 'video',
                videoUrl: 'https://www.youtube.com/watch?v=1PnVor36_40',
                isPreview: false,
            },
        ],
    })

    // Module 2: JavaScript Programming
    const module2 = await prisma.courseModule.create({
        data: {
            courseId: course.id,
            title: 'JavaScript ES6+ Programming',
            description: 'Master modern JavaScript',
            order: 1,
            duration: 800,
            moduleImage: '/uploads/courses/modules/javascript-module.jpg',
        },
    })

    const module2Chapter1 = await prisma.courseChapter.create({
        data: {
            moduleId: module2.id,
            title: 'JavaScript Fundamentals',
            description: 'Variables, data types, and operators',
            order: 0,
            duration: 200,
        },
    })

    await prisma.courseSection.createMany({
        data: [
            {
                chapterId: module2Chapter1.id,
                title: 'JavaScript Introduction',
                contentType: 'video',
                content: `# JavaScript Introduction`,
                order: 0,
                duration: 25,
                sectionType: 'video',
                videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
                isPreview: true,
            },
        ],
    })

    // Module 3: React Framework
    const module3 = await prisma.courseModule.create({
        data: {
            courseId: course.id,
            title: 'React - Building Modern UIs',
            description: 'Learn React from scratch',
            order: 2,
            duration: 900,
        },
    })

    const module3Chapter1 = await prisma.courseChapter.create({
        data: {
            moduleId: module3.id,
            title: 'React Fundamentals',
            description: 'Components, props, and state',
            order: 0,
            duration: 250,
        },
    })

    await prisma.courseSection.createMany({
        data: [
            {
                chapterId: module3Chapter1.id,
                title: 'What is React?',
                contentType: 'video',
                content: `# What is React?`,
                order: 0,
                duration: 20,
                sectionType: 'video',
                videoUrl: 'https://www.youtube.com/watch?v=Tn6-PIqc4UM',
                isPreview: false,
            },
        ],
    })

    // Module 4: Backend Development
    const module4 = await prisma.courseModule.create({
        data: {
            courseId: course.id,
            title: 'Backend with Node.js & Express',
            description: 'Build powerful server-side applications',
            order: 3,
            duration: 700,
        },
    })

    console.log('✅ All modules and chapters recreated')
    // This part of the instruction seems to be frontend code and is not applicable to this seed file.
    // const chapterTotal = getTotalChapterCount()
    // const teacherData = courseInfo.instructor

    // // Helper to safely parse JSON or return original value
    // const safeParse = (data: any) => {
    //   if (!data) return []
    //   if (Array.isArray(data)) return data
    //   try {
    //     const parsed = JSON.parse(data)
    //     return Array.isArray(parsed) ? parsed : [parsed]
    //   } catch (e) {
    //     // Fallback: If it's a multiline string with hyphens, convert to array
    //     if (typeof data === 'string' && data.includes('\n')) {
    //       return data
    //         .split('\n')
    //         .map(line => line.replace(/^-\s*/, '').trim())
    //         .filter(Boolean)
    //     }
    //     return [data]
    //   }
    // }

    // const objectives = safeParse(courseInfo.learningObjectives)
    // const requiredKnowledge = safeParse(courseInfo.requirements)

    // Create course achievements (using upsert or delete/recreate)
    await prisma.courseAchievement.deleteMany({ where: { courseId: course.id } })
    await prisma.courseAchievement.createMany({
        data: [
            {
                courseId: course.id,
                badgeType: 'completion',
                title: 'Web Development Master',
                description: 'Completed the entire Web Development Bootcamp',
                icon: '🏆',
                criteria: JSON.stringify({ type: 'course_completion', courseId: course.id }),
            },
            {
                courseId: course.id,
                badgeType: 'quiz',
                title: 'Quiz Champion',
                description: 'Scored 100% on all quizzes',
                icon: '🎯',
                criteria: JSON.stringify({ type: 'perfect_quizzes', courseId: course.id }),
            },
        ],
    })

    console.log('✅ Achievements created')

    console.log('🎉 Web Development Course seeded successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
