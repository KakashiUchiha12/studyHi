const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const userId = 'cml5dgg4z0000mv1inayh4ukr';
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { profile: true }
    });
    console.log('USER_CHECK_RESULT:', JSON.stringify(user, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
    ));
}

main().catch(console.error).finally(() => prisma.$disconnect());
