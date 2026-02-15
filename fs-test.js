const fs = require('fs/promises');
const path = require('path');

async function testFs() {
    const userId = 'cmldyb76k0003v5qs1qm11npi';
    const date = new Date();
    const relativeDir = path.join('uploads', 'drives', userId, date.getFullYear().toString(), (date.getMonth() + 1).toString());
    const uploadDir = path.join(process.cwd(), relativeDir);

    console.log(`Testing FS operations for: ${uploadDir}`);

    try {
        console.log('1. Attempting mkdir recursive...');
        await fs.mkdir(uploadDir, { recursive: true });
        console.log('   SUCCESS: Directory exists/created.');

        const testFile = path.join(uploadDir, 'test-write.txt');
        console.log(`2. Attempting writeFile: ${testFile}`);
        await fs.writeFile(testFile, 'Hello from test-fs script');
        console.log('   SUCCESS: File written.');

        console.log('3. Attempting readFile...');
        const content = await fs.readFile(testFile, 'utf8');
        console.log(`   SUCCESS: Read content: ${content}`);

        console.log('4. Attempting unlink...');
        await fs.unlink(testFile);
        console.log('   SUCCESS: File deleted.');

    } catch (error) {
        console.error('   FAILED:', error);
    }
}

testFs();
