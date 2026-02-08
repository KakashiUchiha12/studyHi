
import { prisma } from '../lib/prisma';
import { syncSubjectFilesToDrive } from '../lib/drive/subject-sync';

async function main() {
    const subjectName = "Operating Systems"; // Adjust if needed
    const subject = await prisma.subject.findFirst({
        where: { name: subjectName },
        include: { materials: true }
    });

    if (!subject) {
        console.error(`Subject "${subjectName}" not found`);
        return;
    }

    console.log(`Found subject: ${subject.name} (${subject.id})`);
    console.log(`User ID: ${subject.userId}`);
    console.log(`Materials count: ${subject.materials.length}`);

    subject.materials.forEach(m => {
        console.log(`Material: ${m.title} (${m.id})`);
        console.log(`Content: ${m.content}`);
    });

    console.log("Starting sync...");
    try {
        const result = await syncSubjectFilesToDrive({
            userId: subject.userId,
            subjectId: subject.id
        });
        console.log("Sync result:", result);
    } catch (e) {
        console.error("Sync failed:", e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
