# Learning Management System (LMS) Implementation

## Overview
This implementation provides a complete Learning Management System for the studyHi application, enabling course creation, enrollment, progress tracking, quizzes, reviews, and achievement badges.

## Architecture

### Backend Services (lib/courses/)

#### 1. course-operations.ts
**Purpose**: Core course management and CRUD operations

**Key Functions**:
- `fetchCourseList(filters, pagination)` - List courses with filtering and pagination
- `retrieveCourseDetails(courseId, userId)` - Get detailed course info with user enrollment status
- `createNewCourse(instructorId, courseData)` - Create new course with auto-generated slug
- `modifyCourseData(courseId, updateData)` - Update course details
- `removeCourse(courseId)` - Delete course and cascading relations
- `verifyInstructorAccess(courseId, instructorId)` - Check instructor ownership
- `updateCourseStatistics(courseId)` - Recalculate ratings and enrollments
- `calculateChapterCount(courseId)` - Count total chapters

**Filters Supported**:
- category, difficulty, language, status
- instructorId, search (title/description)
- minPrice, maxPrice, rating

#### 2. progress-tracker.ts
**Purpose**: Track student enrollment and course progress

**Key Functions**:
- `registerStudentEnrollment(courseId, studentId)` - Enroll student in course
- `removeStudentEnrollment(courseId, studentId)` - Unenroll student
- `markChapterAsComplete(enrollmentId, chapterId, studentId)` - Mark chapter done
- `recalculateEnrollmentProgress(enrollmentId)` - Update progress percentage
- `fetchStudentProgress(courseId, studentId)` - Get detailed progress info
- `fetchEnrolledStudentsList(courseId, pagination)` - List enrolled students
- `computeCourseAnalytics(courseId)` - Calculate completion rates and stats

**Progress Calculation**:
- Percentage based on completed chapters vs total chapters
- Automatic completion detection (100% = completed)
- Last access time tracking

#### 3. quiz-handler.ts
**Purpose**: Quiz management with randomization and grading

**Key Functions**:
- `retrieveQuizWithRandomization(quizId)` - Fetch quiz with shuffled questions/answers
- `processQuizSubmission(quizId, userId, answers, timeTaken)` - Grade and record attempt
- `fetchStudentQuizHistory(userId, quizId)` - Get past attempts and statistics
- `retrieveQuizAttemptDetails(attemptId)` - Get specific attempt details

**Randomization Algorithm**:
- Questions shuffled using Fisher-Yates algorithm
- Answer options shuffled independently
- Correct answer indices remapped to new positions
- Mapping preserved for grading

**Grading**:
- Compare sorted answer arrays for exact match
- Calculate percentage score
- Check against passing score threshold
- Return detailed results if showAnswers enabled

#### 4. achievement-manager.ts
**Purpose**: Badge and achievement system

**Key Functions**:
- `awardStudentBadge(userId, achievementId)` - Grant badge to user
- `evaluateBadgeEligibility(userId, courseId)` - Check and award eligible badges
- `verifyBadgeCriteria(userId, criteria)` - Validate specific criteria
- `fetchUserBadgeCollection(userId)` - Get user's badges
- `initializeDefaultBadges(courseId)` - Create default badges for new course
- `checkEnrollmentBadge(userId, courseId)` - Award enrollment badges
- `checkCompletionBadge(userId, courseId)` - Award completion badges

**Badge Types Supported**:
- enrollment: Course enrollment
- completion: Course completion
- quiz_score: High quiz scores
- course_count: Multiple courses completed
- streak: Learning streak (placeholder)

### API Routes (app/api/courses/)

#### Main Course Routes

**GET /api/courses**
- Lists courses with filtering and pagination
- Query params: category, difficulty, language, status, search, price range, rating
- Returns: courses array, pagination metadata

**POST /api/courses**
- Creates new course (instructor only)
- Required: title, category
- Auto-generates slug from title + timestamp
- Returns: created course with instructor details

**GET /api/courses/[id]**
- Gets course details with modules, chapters, sections
- Returns enrollment status if user is logged in
- Hides draft courses from non-instructors

**PUT /api/courses/[id]**
- Updates course (instructor only)
- Validates instructor ownership
- Auto-sets publishedAt when status changes to 'published'

**DELETE /api/courses/[id]**
- Deletes course (instructor only)
- Cascades to modules, chapters, sections, quizzes

#### Enrollment Routes

**POST /api/courses/[id]/enroll**
- Enrolls student in course
- Prevents enrollment in draft courses
- Awards enrollment badges
- Creates notification
- Updates course statistics

**POST /api/courses/[id]/unenroll**
- Removes student enrollment
- Deletes progress records (cascading)
- Updates course statistics

#### Module Routes

**GET /api/courses/[id]/modules**
- Lists all modules with chapters and sections
- Ordered by module.order, chapter.order

**POST /api/courses/[id]/modules**
- Creates new module (instructor only)
- Auto-calculates next order number
- Required: title

**PUT /api/courses/[id]/modules/[moduleId]**
- Updates module (instructor only)
- Validates module belongs to course

**DELETE /api/courses/[id]/modules/[moduleId]**
- Deletes module (instructor only)
- Cascades to chapters and sections

#### Chapter Routes

**GET /api/courses/[id]/modules/[moduleId]/chapters**
- Lists chapters for a module
- Includes sections and quizzes

**POST /api/courses/[id]/modules/[moduleId]/chapters**
- Creates new chapter (instructor only)
- Auto-calculates next order number
- Required: title

**PUT /api/courses/[id]/chapters/[chapterId]**
- Updates chapter (instructor only)

**DELETE /api/courses/[id]/chapters/[chapterId]**
- Deletes chapter (instructor only)

**POST /api/courses/[id]/chapters/[chapterId]/complete**
- Marks chapter as complete for student
- Requires active enrollment
- Updates progress percentage
- Awards completion badges if course finished

#### Section Routes

**GET /api/courses/[id]/chapters/[chapterId]/sections**
- Lists sections for a chapter
- Includes quiz details if present

**POST /api/courses/[id]/chapters/[chapterId]/sections**
- Creates new section (instructor only)
- Required: title, contentType
- Supports: text, video, file content types

**PUT /api/courses/[id]/sections/[sectionId]**
- Updates section (instructor only)

**DELETE /api/courses/[id]/sections/[sectionId]**
- Deletes section (instructor only)

#### Review Routes

**GET /api/courses/[id]/reviews**
- Lists course reviews with pagination
- Includes reviewer info (name, image)
- Default: 10 per page

**POST /api/courses/[id]/reviews**
- Creates review for course
- Requires enrollment
- Requires 30% course completion
- Required: rating (1-5)
- One review per student per course
- Updates course statistics

**PUT /api/courses/[id]/reviews/[reviewId]**
- Updates user's own review
- Updates course statistics

**DELETE /api/courses/[id]/reviews/[reviewId]**
- Deletes user's own review
- Updates course statistics

#### Bookmark Routes

**POST /api/courses/[id]/bookmark**
- Bookmarks course for user
- One bookmark per user per course

**DELETE /api/courses/[id]/bookmark**
- Removes bookmark

#### Announcement Routes

**GET /api/courses/[id]/announcements**
- Lists course announcements
- Newest first

**POST /api/courses/[id]/announcements**
- Creates announcement (instructor only)
- Required: title, content
- Sends notifications to all enrolled students

#### Analytics Routes

**GET /api/courses/[id]/analytics**
- Gets course analytics (instructor only)
- Returns:
  - Total enrollments
  - Completed enrollments
  - Completion rate
  - Average progress
  - Recent enrollments (last 30 days)

#### Students Routes

**GET /api/courses/[id]/students**
- Lists enrolled students (instructor only)
- Includes progress info
- Pagination support (default 50 per page)

#### Quiz Routes

**GET /api/courses/quizzes/[quizId]**
- Fetches quiz for student attempt
- Requires enrollment
- Randomizes questions and answers
- Excludes correct answers from response

**POST /api/courses/quizzes/[quizId]/submit**
- Submits quiz answers for grading
- Required: answers object { questionId: [answerIndices] }
- Optional: timeTaken (seconds)
- Returns:
  - Score percentage
  - Pass/fail status
  - Detailed results (if showAnswers enabled)
- Awards quiz badges if eligible

## Security & Authorization

### Authentication
- All protected routes use `getServerSession(authOptions)`
- Unauthenticated requests return 401

### Authorization Levels
1. **Public**: Course listing, course details (published only)
2. **Student**: Enrollment, progress, reviews, quizzes
3. **Instructor**: Create/edit own courses, view analytics, manage content

### Access Controls
- Instructors can only edit their own courses
- Students must be enrolled to access course content
- Reviews require 30% completion
- Draft courses hidden from non-instructors

## Data Flow Examples

### Course Creation Flow
1. Instructor creates course via POST /api/courses
2. Auto-generates unique slug
3. Creates with draft status
4. Instructor adds modules, chapters, sections
5. Instructor publishes (status: 'published')

### Student Enrollment Flow
1. Student enrolls via POST /api/courses/[id]/enroll
2. Creates enrollment record with 0% progress
3. Awards enrollment badges
4. Sends notification
5. Updates course enrollment count

### Progress Tracking Flow
1. Student views chapter
2. Student completes chapter via POST /complete
3. Creates/updates ChapterProgress record
4. Recalculates overall course progress
5. Marks course complete if 100%
6. Awards completion badges if finished

### Quiz Flow
1. Student requests quiz via GET /quizzes/[id]
2. Backend shuffles questions and answers
3. Student receives quiz without correct answers
4. Student submits via POST /submit
5. Backend grades against original order
6. Returns score and results
7. Awards badges for high scores

## Database Models Used

### Course
- Basic info, pricing, status, ratings
- Relations: instructor, modules, enrollments, reviews

### CourseModule
- Groups chapters together
- Has order for sequencing

### CourseChapter
- Individual lessons
- Has order within module
- Can be marked as free preview

### CourseSection
- Content blocks within chapters
- Supports text, video, file types
- Optional quiz attachment

### Quiz
- Associated with section
- Has questions, time limit, passing score
- Randomization settings

### QuizQuestion
- Multiple choice questions
- Options and correct answers stored as JSON
- Order for default display

### QuizAttempt
- Records student submissions
- Stores answers, score, time taken

### CourseEnrollment
- Links students to courses
- Tracks progress percentage
- Completion timestamp

### ChapterProgress
- Granular progress tracking
- Completion status per chapter

### CourseReview
- Student feedback
- Rating and comment
- One per student per course

### CourseBookmark
- Save for later functionality

### CourseAnnouncement
- Instructor broadcasts to students

### CourseAchievement
- Badge definitions
- Criteria stored as JSON

### UserBadge
- Badges earned by users
- Visibility toggle

## Error Handling

All routes implement consistent error handling:
- 400: Bad request (validation errors)
- 401: Authentication required
- 403: Forbidden (authorization failed)
- 404: Resource not found
- 500: Internal server error

## Notifications

Notifications created for:
- Course enrollment
- Course announcements
- (Discussion replies - handled elsewhere)

## Badge Criteria Format

```json
{
  "type": "enrollment|completion|quiz_score|course_count",
  "value": number,
  "courseId": "string"
}
```

## Future Enhancements

Potential additions not in current scope:
- Course certificates
- Discussion forums per chapter
- Live sessions/webinars
- Assignment submissions
- Peer reviews
- Course preview mode
- Coupon/discount codes
- Bulk enrollment
- Course cloning
- Content versioning

## Testing Recommendations

1. Test enrollment flows
2. Test progress calculation accuracy
3. Test quiz randomization consistency
4. Test badge awarding logic
5. Test instructor authorization
6. Test review 30% requirement
7. Test pagination on large datasets
8. Test concurrent enrollments
9. Test quiz submission edge cases
10. Test notification delivery

## Integration Points

This LMS integrates with existing studyHi features:
- **Auth**: Uses NextAuth sessions
- **Database**: Uses dbService.getPrisma()
- **Notifications**: Uses Notification model
- **Users**: Uses User model
- **Profile**: User profiles display courses

## Performance Considerations

- Pagination on all list endpoints
- Indexed fields: courseId, userId, status, category
- Aggregate queries for statistics
- Includes/selects to minimize data transfer
- Order preservation for deterministic results

## API Response Formats

### Course List
```json
{
  "courses": [...],
  "totalCount": number,
  "currentPage": number,
  "totalPages": number,
  "hasNextPage": boolean,
  "hasPreviousPage": boolean
}
```

### Course Details
```json
{
  "id": "string",
  "title": "string",
  ...courseFields,
  "instructor": {...},
  "modules": [...],
  "reviews": [...],
  "isEnrolled": boolean,
  "userProgress": number,
  "_count": {...}
}
```

### Quiz Result
```json
{
  "attemptId": "string",
  "score": number,
  "totalQuestions": number,
  "correctAnswers": number,
  "isPassed": boolean,
  "passingScore": number,
  "results": [...]
}
```

## Conclusion

This implementation provides a production-ready LMS with all essential features for online learning. It follows Next.js and Prisma best practices, implements proper security, and integrates seamlessly with the existing studyHi application.
