
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking Prisma Client...');
    if (prisma.post) {
        console.log('✅ prisma.post is defined.');
        try {
            const count = await prisma.post.count();
            console.log('✅ Post count:', count);
        } catch (e) {
            console.error('❌ Database connection failed:', e.message);
        }
    } else {
        console.error('❌ prisma.post is UNDEFINED. You must regenerate the client.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
