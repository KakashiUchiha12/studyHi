const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
    console.error(`${colors.red}❌ ${message}${colors.reset}`);
    process.exitCode = 1;
}

function success(message) {
    console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

console.log('🚀 Starting Deployment Verification...\n');

// 1. Check Environment Variables
log('🔍 Checking Environment Variables...', 'blue');
const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'PUSHER_APP_ID',
    'PUSHER_KEY',
    'PUSHER_SECRET',
    'PUSHER_CLUSTER',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
];

// Check if .env or .env.production exists
const envPath = fs.existsSync('.env.production') ? '.env.production' : '.env';
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const missingVars = [];

    requiredEnvVars.forEach(key => {
        if (!envContent.includes(`${key}=`) || envContent.includes(`${key}=your-`)) {
            missingVars.push(key);
        }
    });

    if (missingVars.length > 0) {
        error(`Missing or default values for environment variables: ${missingVars.join(', ')}`);
    } else {
        success('Environment variables look good');
    }
} else {
    log('⚠️  No .env or .env.production file found. Skipping local env check (CI might set these separately).', 'yellow');
}

// 2. Check Critical Files
log('\n🔍 Checking Critical Files...', 'blue');
const criticalFiles = [
    'Dockerfile',
    'docker-compose.yml',
    'package.json',
    'package-lock.json',
    'prisma/schema.prisma',
    'next.config.mjs',
    'scripts/init-database.js',
    'scripts/production-build.js'
];

criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
        success(`Found ${file}`);
    } else {
        error(`Missing critical file: ${file}`);
    }
});

// 3. Check Docker Ignore
log('\n🔍 Checking .dockerignore...', 'blue');
if (fs.existsSync('.dockerignore')) {
    const dockerIgnore = fs.readFileSync('.dockerignore', 'utf8');
    if (dockerIgnore.includes('scripts') && !dockerIgnore.includes('!scripts')) {
        // Check if it's explicitly ignored
        // Simple check: line starting with "scripts"
        const isIgnored = dockerIgnore.split('\n').some(line => line.trim() === 'scripts');
        if (isIgnored) {
            error('.dockerignore is ignoring "scripts" folder! Verification failed.');
        } else {
            success('.dockerignore looks okay regarding scripts folder');
        }
    } else {
        success('.dockerignore does not block scripts folder');
    }
}

// 4. Check Package Scripts
log('\n🔍 Checking Package Scripts...', 'blue');
const pkg = require(path.join(process.cwd(), 'package.json'));
const requiredScripts = ['build', 'start', 'db:init', 'db:push'];

requiredScripts.forEach(script => {
    if (pkg.scripts && pkg.scripts[script]) {
        success(`Script "${script}" exists`);
    } else {
        error(`Missing npm script: "${script}"`);
    }
});

// 5. Dependency Check
log('\n🔍 Checking Dependencies...', 'blue');
if (!pkg.devDependencies['tailwindcss']) {
    error('tailwindcss missing from devDependencies (required for build)');
} else {
    success(`tailwindcss found: ${pkg.devDependencies['tailwindcss']}`);
}

// Final Result
console.log('\n================================');
if (process.exitCode === 1) {
    console.log(`${colors.red}❌ Verification FAILED. Fix issues before pushing.${colors.reset}`);
    process.exit(1);
} else {
    console.log(`${colors.green}✅ Verification PASSED. Ready for deployment!${colors.reset}`);
}
