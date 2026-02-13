
const { createProject } = require('./lib/projects/projectService');
const { prisma } = require('./lib/prisma');

async function verify() {
    try {
        // Get a user to act as author
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log('No user found to test with');
            return;
        }

        console.log('Testing project creation for user:', user.email);

        const project = await createProject({
            authorId: user.id,
            title: "Test Project Fix",
            description: "This is a test project to verify the fix for websiteUrl and JSON serialization.",
            category: "Web Development",
            tags: ["test", "fix"],
            sections: [
                {
                    order: 1,
                    title: "Introduction",
                    content: "Testing websiteUrl field support",
                    websiteUrl: "https://example.com"
                }
            ]
        });

        console.log('SUCCESS: Project created with ID:', project.id);
        console.log('Section websiteUrl:', project.sections[0].websiteUrl);

        // Clean up
        await prisma.project.delete({ where: { id: project.id } });
        console.log('Cleaned up test project');

    } catch (error) {
        console.error('FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
