const { execSync } = require('child_process');

console.log('🔄 Initializing database...');

try {
    console.log('1. Pushing schema to database...');
    // process.env.DATABASE_URL is available here
    execSync('npx prisma db push --accept-data-loss --skip-generate', { stdio: 'inherit' });

    console.log('✅ Database initialization completed successfully.');
} catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
}
