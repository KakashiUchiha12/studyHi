const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Finding "Complete Web Development Bootcamp 2026" course...');
        const course = await prisma.course.findUnique({
            where: { slug: 'complete-web-development-bootcamp-2026' },
            include: {
                modules: {
                    include: {
                        chapters: true
                    }
                }
            }
        });

        if (!course) {
            console.error('Course not found!');
            return;
        }

        console.log('Enriching chapters with sections and quizzes...');

        for (const module of course.modules) {
            for (const chapter of module.chapters) {
                console.log(`Processing chapter: ${chapter.title}`);

                // Clean up existing sections for this chapter to avoid unique constraint issues
                await prisma.courseSection.deleteMany({
                    where: { chapterId: chapter.id }
                });
                console.log(`Cleared existing sections for ${chapter.title}`);

                // Add a Text Section
                await prisma.courseSection.create({
                    data: {
                        chapterId: chapter.id,
                        title: `About ${chapter.title}`,
                        contentType: 'text',
                        content: `<h3>Mastering ${chapter.title}</h3><p>In this lesson, we will dive deep into the core concepts of <strong>${chapter.title}</strong>. Understanding this is crucial for your career as a web developer.</p><ul><li>Key Concept 1</li><li>Key Concept 2</li><li>Actionable Steps</li></ul>`,
                        order: 1,
                        sectionType: 'text'
                    }
                });

                // Add a Video Section
                await prisma.courseSection.create({
                    data: {
                        chapterId: chapter.id,
                        title: `${chapter.title} Deep Dive Video`,
                        contentType: 'video',
                        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder video
                        order: 2,
                        sectionType: 'video'
                    }
                });

                // Add a Quiz Section
                const quizSection = await prisma.courseSection.create({
                    data: {
                        chapterId: chapter.id,
                        title: `${chapter.title} Knowledge Check`,
                        contentType: 'quiz',
                        order: 3,
                        sectionType: 'quiz'
                    }
                });

                // Add Quiz details and questions
                await prisma.quiz.create({
                    data: {
                        sectionId: quizSection.id,
                        title: `${chapter.title} Quiz`,
                        description: `Test your knowledge of ${chapter.title} topics covered in this chapter.`,
                        passingScore: 70,
                        questions: {
                            create: [
                                {
                                    question: `What is the primary purpose of ${chapter.title}?`,
                                    questionType: 'single',
                                    options: JSON.stringify(['To make things pretty', 'To handle logic', 'To structure data', 'None of the above']),
                                    correctAnswers: JSON.stringify(['To structure data']),
                                    explanation: `${chapter.title} is designed to provide the core structure or logic for this specific module.`,
                                    order: 1
                                },
                                {
                                    question: `Which of these is a best practice in ${chapter.title}?`,
                                    questionType: 'single',
                                    options: JSON.stringify(['Ignoring errors', 'Writing clean code', 'Copy-pasting blindly', 'Using global variables']),
                                    correctAnswers: JSON.stringify(['Writing clean code']),
                                    explanation: 'Clean, maintainable code is the hallmark of a professional developer.',
                                    order: 2
                                }
                            ]
                        }
                    }
                });
            }
        }

        console.log('Enrichment completed successfully.');
    } catch (error) {
        console.error('Error during enrichment:', error);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

main();
