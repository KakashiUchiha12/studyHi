import { prisma } from '../lib/prisma';

async function findBooks() {
    const materials = await prisma.material.findMany();
    const books = materials.filter(m => m.title.toLowerCase().includes('books'));

    console.log(`Found ${books.length} total materials with 'Books' in title`);
    for (const m of books) {
        console.log(`- Material: ${m.title} (ID: ${m.id}) Subject: ${m.subjectId}`);
        console.log(`  Content: ${m.content}`);
    }
}

findBooks().finally(() => prisma.$disconnect());
