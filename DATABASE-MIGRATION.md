# Database Migration Guide - LMS Courses Feature

This guide explains how to set up the database for the new LMS (Learning Management System) courses feature.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- MySQL database (production) or SQLite (development)
- Prisma CLI (`npx prisma`)

## Database Schema Changes

The LMS feature adds **15 new models** to the database:

### Core Course Models
1. **Course** - Main course entity with metadata, pricing, and status
2. **CourseModule** - Logical sections within courses
3. **CourseChapter** - Individual lessons within modules
4. **CourseSection** - Content blocks (text, video, file, quiz)

### Quiz System Models
5. **Quiz** - Quiz configuration and settings
6. **QuizQuestion** - Individual questions with options
7. **QuizAttempt** - Student quiz submissions with scores

### Enrollment & Progress Models
8. **CourseEnrollment** - Student-course relationships
9. **ChapterProgress** - Chapter completion tracking

### Interaction Models
10. **CourseReview** - Course ratings and reviews
11. **CourseBookmark** - Saved/favorited courses
12. **CourseDiscussion** - Q&A threads per chapter
13. **CourseAnnouncement** - Instructor notifications

### Achievement Models
14. **CourseAchievement** - Badge definitions
15. **UserBadge** - User-earned achievements

### Updated Models
- **User** model: Added 8 new relations for courses

## Migration Steps

### Step 1: Backup Your Database

**For MySQL (Production)**:
```bash
# Export existing database
mysqldump -u username -p database_name > backup_before_lms.sql

# Or use your hosting provider's backup tool
```

**For SQLite (Development)**:
```bash
# Copy the database file
cp prisma/dev.db prisma/dev.db.backup
```

### Step 2: Verify Prisma Schema

Check that the schema includes all course models:

```bash
# View the schema
cat prisma/schema.prisma | grep "model Course"

# Should show: Course, CourseModule, CourseChapter, etc.
```

### Step 3: Run Migration

**Option A: Using `db push` (Development)**

This is faster and doesn't create migration files:

```bash
npx prisma db push
```

Expected output:
```
🚀 Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

**Option B: Using `migrate dev` (Recommended)**

This creates migration files for version control:

```bash
npx prisma migrate dev --name add_courses_feature
```

This will:
1. Create a new migration file in `prisma/migrations/`
2. Apply the migration to your database
3. Generate the Prisma Client

Expected output:
```
Applying migration `20260205_add_courses_feature`
✔ Database schema updated
✔ Generated Prisma Client
```

**Option C: For Production (After deploying code)**

```bash
# Deploy pending migrations
npx prisma migrate deploy
```

### Step 4: Verify Migration

Check that tables were created:

**For MySQL**:
```bash
mysql -u username -p database_name -e "SHOW TABLES LIKE '%course%';"
```

**For SQLite**:
```bash
npx prisma studio
# Open Prisma Studio and check for new tables
```

**Using Prisma Studio (All databases)**:
```bash
npx prisma studio
```

Navigate to http://localhost:5555 and verify these tables exist:
- courses
- course_modules
- course_chapters
- course_sections
- quizzes
- quiz_questions
- quiz_attempts
- course_enrollments
- chapter_progress
- course_reviews
- course_bookmarks
- course_discussions
- course_announcements
- course_achievements
- user_badges

### Step 5: Seed Initial Data (Optional)

Create default achievements:

```bash
# Create a seed script if needed
npx prisma db seed
```

Or use the application to create initial data through the UI.

## Environment Variables

Ensure these variables are set in your `.env` file:

```env
# Database Connection
DATABASE_URL="mysql://user:password@localhost:3306/studyhi"
# or for SQLite:
# DATABASE_URL="file:./dev.db"

# NextAuth (Required for authentication)
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# File Upload Paths (Optional)
UPLOAD_DIR="/uploads/courses"
MAX_FILE_SIZE="10485760" # 10MB in bytes
```

## Rollback Instructions

If you need to rollback the migration:

### Using Migration History

```bash
# View migration history
npx prisma migrate status

# Rollback to previous migration
npx prisma migrate resolve --rolled-back 20260205_add_courses_feature
```

### Manual Rollback (If needed)

**For MySQL**:
```bash
# Restore from backup
mysql -u username -p database_name < backup_before_lms.sql
```

**For SQLite**:
```bash
# Restore backup
mv prisma/dev.db.backup prisma/dev.db
```

Then run:
```bash
npx prisma generate
```

## Troubleshooting

### Error: "P3009: Failed to create migration"

**Solution**: There might be pending migrations. Run:
```bash
npx prisma migrate resolve --applied <migration-name>
npx prisma migrate dev
```

### Error: "P1001: Can't reach database server"

**Solution**: Check your DATABASE_URL in `.env`:
```bash
# Test connection
npx prisma db pull
```

### Error: "P2002: Unique constraint failed"

**Solution**: A unique field (like email or slug) has duplicates. Clean up data:
```sql
-- Find duplicates
SELECT email, COUNT(*) FROM User GROUP BY email HAVING COUNT(*) > 1;

-- Remove duplicates or update them
```

### Error: "Generated Prisma Client out of sync"

**Solution**: Regenerate the client:
```bash
npx prisma generate
```

### Error: "Error: connect ECONNREFUSED"

**Solution**: 
1. Check if MySQL is running: `sudo systemctl status mysql`
2. Verify credentials in DATABASE_URL
3. Check firewall settings

## Post-Migration Checklist

- [ ] All course-related tables created successfully
- [ ] User model has new relations (check with Prisma Studio)
- [ ] Prisma Client regenerated (check `node_modules/.prisma/client`)
- [ ] No TypeScript compilation errors (`npm run type-check`)
- [ ] Application builds successfully (`npm run build`)
- [ ] Can access `/courses` page without errors
- [ ] Can create a test course as instructor
- [ ] Can enroll in a test course as student

## Testing the Migration

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test database access**:
   ```bash
   npx prisma studio
   ```

3. **Test API endpoints**:
   ```bash
   # Test course list endpoint
   curl http://localhost:3000/api/courses
   ```

4. **Test through UI**:
   - Navigate to `/courses`
   - Go to `/courses/instructor`
   - Try creating a course

## Performance Optimization

After migration, consider adding indexes for better performance:

```sql
-- These are already in the schema, but verify:
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_enrollments_user ON course_enrollments(user_id);
CREATE INDEX idx_progress_user ON chapter_progress(user_id);
```

## Data Migration (If needed)

If you have existing course data in another format:

```typescript
// scripts/migrate-courses.ts
import { prisma } from '../lib/prisma';

async function migrateCourses() {
  // Read old data
  const oldCourses = await readOldCourseData();
  
  // Transform and insert
  for (const oldCourse of oldCourses) {
    await prisma.course.create({
      data: {
        title: oldCourse.name,
        userId: oldCourse.instructorId,
        // ... map other fields
      }
    });
  }
}
```

## Support

If you encounter issues:

1. Check the error messages carefully
2. Review Prisma documentation: https://www.prisma.io/docs
3. Check database logs for detailed errors
4. Ensure all dependencies are installed: `npm install`
5. Try regenerating Prisma Client: `npx prisma generate`

## Migration Verification Script

Create a test script to verify the migration:

```javascript
// scripts/verify-lms-schema.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifySchema() {
  try {
    // Test each model
    await prisma.course.findMany({ take: 1 });
    await prisma.courseModule.findMany({ take: 1 });
    await prisma.courseChapter.findMany({ take: 1 });
    await prisma.courseSection.findMany({ take: 1 });
    await prisma.quiz.findMany({ take: 1 });
    await prisma.quizQuestion.findMany({ take: 1 });
    await prisma.quizAttempt.findMany({ take: 1 });
    await prisma.courseEnrollment.findMany({ take: 1 });
    await prisma.chapterProgress.findMany({ take: 1 });
    await prisma.courseReview.findMany({ take: 1 });
    await prisma.courseBookmark.findMany({ take: 1 });
    await prisma.courseDiscussion.findMany({ take: 1 });
    await prisma.courseAnnouncement.findMany({ take: 1 });
    await prisma.courseAchievement.findMany({ take: 1 });
    await prisma.userBadge.findMany({ take: 1 });
    
    console.log('✅ All LMS tables accessible!');
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifySchema();
```

Run it:
```bash
node scripts/verify-lms-schema.js
```

---

**Migration Date**: February 2026  
**Schema Version**: v2.0 (with LMS)  
**Breaking Changes**: None (additive only)  
**Estimated Migration Time**: 2-5 minutes

For questions or issues, please refer to the IMPLEMENTATION-STATUS.md and ARCHITECTURE.md documents.
