const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- DIANOSTIC: NOTIFICATION TABLE ---");
    try {
        const count = await prisma.notification.count();
        console.log("Total notifications:", count);

        const messages = await prisma.notification.findMany({
            where: { type: 'message' },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { sender: { select: { name: true } } }
        });

        if (messages.length === 0) {
            console.log("No notifications of type 'message' found.");
        } else {
            console.log("Latest 'message' notifications:");
            messages.forEach(m => {
                console.log(`- To: ${m.userId}, From: ${m.sender?.name || 'Unknown'}, Content: ${m.message.substring(0, 30)}, Created: ${m.createdAt}`);
            });
        }

        const recent = await prisma.notification.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        });
        console.log("Latest 5 notifications (any type):");
        recent.forEach(r => console.log(`- Type: ${r.type}, Title: ${r.title}, Created: ${r.createdAt}`));

    } catch (e) {
        console.error("Diagnostic failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
