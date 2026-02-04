// Check the production database structure
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient(); // connection string from env

async function checkDatabase() {
    console.log('🔍 Checking database connection and structure...');
    console.log('URL:', process.env.DATABASE_URL ? 'Set' : 'Not Set');

    try {
        // 1. Try to connect
        await prisma.$connect();
        console.log('✅ Connected to database.');

        // 2. Check for User table
        try {
            const userCount = await prisma.user.count();
            console.log(`✅ User table exists. Count: ${userCount}`);

            if (userCount === 0) {
                console.log('⚠️ Warning: No users found. You may need to seed the database or register a user.');
            } else {
                const users = await prisma.user.findMany({ select: { email: true, id: true } });
                console.log('Users found:', users.map(u => u.email).join(', '));
            }

        } catch (e) {
            console.error('❌ Failed to query User table. Migrations might be missing.');
            console.error(e.message);
        }

    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
