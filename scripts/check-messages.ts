
import { PrismaClient } from '@prisma/client';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const prisma = new PrismaClient();

async function main() {
    console.log('Checking recent messages...');

    const messages = await prisma.message.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
    });

    console.log(`Found ${messages.length} recent messages:`);
    messages.forEach(m => {
        console.log(`- [${m.id}] ${m.content} (Sender: ${m.senderId})`);
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
