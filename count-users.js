const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.user.count();
        console.log(`\n================================`);
        console.log(`Total Users in Database: ${count}`);
        console.log(`================================\n`);
    } catch (error) {
        console.error('Error counting users:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
