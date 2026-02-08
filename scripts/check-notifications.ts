
import { PrismaClient } from '@prisma/client';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
    console.log('Checking recent notifications...');

    const notifications = await prisma.notification.findMany({
        take: 5,
        orderBy: { timestamp: 'desc' },
        include: {
            sender: { select: { name: true } },
        }
    });

    console.log(`Found ${notifications.length} recent notifications:`);
    notifications.forEach(n => {
        console.log(`- [${n.type}] ${n.title}: ${n.message} (Read: ${n.read}) - To: ${n.userId} From: ${n.sender?.name || 'System'} at ${n.timestamp.toISOString()}`);
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
