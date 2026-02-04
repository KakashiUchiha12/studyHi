/**
 * Migration script to initialize Study Drive for existing users
 * Run this after applying the Prisma schema changes
 * 
 * Usage: node scripts/initialize-drives.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const STORAGE_LIMIT = BigInt(10 * 1024 * 1024 * 1024); // 10GB
const BANDWIDTH_LIMIT = BigInt(10 * 1024 * 1024 * 1024); // 10GB

async function main() {
  console.log('🚀 Starting Drive initialization for existing users...\n');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    console.log(`📊 Found ${users.length} users\n`);

    let createdCount = 0;
    let existingCount = 0;
    let errorCount = 0;

    // Create drives for users who don't have one
    for (const user of users) {
      try {
        // Check if drive already exists
        const existingDrive = await prisma.drive.findUnique({
          where: { userId: user.id },
        });

        if (existingDrive) {
          console.log(`✅ User ${user.name} (${user.email}) already has a drive`);
          existingCount++;
          continue;
        }

        // Create drive
        await prisma.drive.create({
          data: {
            userId: user.id,
            storageUsed: BigInt(0),
            storageLimit: STORAGE_LIMIT,
            bandwidthUsed: BigInt(0),
            bandwidthLimit: BANDWIDTH_LIMIT,
            bandwidthReset: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            isPrivate: false,
            allowCopying: 'REQUEST',
          },
        });

        console.log(`✨ Created drive for user ${user.name} (${user.email})`);
        createdCount++;
      } catch (error) {
        console.error(`❌ Error creating drive for user ${user.name}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`   - Drives created: ${createdCount}`);
    console.log(`   - Drives already exist: ${existingCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Total users: ${users.length}`);

    if (createdCount > 0) {
      console.log('\n✅ Drive initialization completed successfully!');
    } else if (existingCount === users.length) {
      console.log('\n✅ All users already have drives!');
    } else {
      console.log('\n⚠️  Some users may not have drives. Check errors above.');
    }
  } catch (error) {
    console.error('\n❌ Fatal error during migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unhandled error:', error);
    process.exit(1);
  });
