import { prisma } from '../lib/prisma';

async function checkActivity() {
    const filename = '3e5337c9-1e28-466f-b1f5-77378e6c62df.jfif';
    const activities = await prisma.driveActivity.findMany({
        where: { targetName: filename },
        orderBy: { createdAt: 'desc' }
    });

    console.log(`Found ${activities.length} activities for file ${filename}`);
    for (const a of activities) {
        console.log(`- Action: ${a.action} TargetType: ${a.targetType} TargetName: ${a.targetName}`);
        console.log(`  Metadata: ${a.metadata}`);
        console.log(`  Date: ${a.createdAt}`);
    }
}

checkActivity().finally(() => prisma.$disconnect());
