# LMS Feature Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        studyHi LMS                              │
│                   Learning Management System                    │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│   Frontend Pages  │────▶│  API Routes       │────▶│  Services        │
│   (10 pages)      │     │  (19 endpoints)   │     │  (4 services)    │
└───────────────────┘     └───────────────────┘     └──────────────────┘
         │                         │                          │
         ▼                         ▼                          ▼
┌───────────────────┐     ┌───────────────────┐     ┌──────────────────┐
│   Components      │     │  Authentication   │     │  Database        │
│   (15 components) │     │  (NextAuth)       │     │  (Prisma + MySQL)│
└───────────────────┘     └───────────────────┘     └──────────────────┘


## Database Schema Hierarchy

Course (Main Entity)
├── CourseModule (1:N)
│   └── CourseChapter (1:N)
│       ├── CourseSection (1:N)
│       │   └── Quiz (1:1) [optional]
│       │       └── QuizQuestion (1:N)
│       │           └── QuizAttempt (N:M via User)
│       └── CourseDiscussion (1:N)
├── CourseEnrollment (N:M with User)
│   └── ChapterProgress (1:N)
├── CourseReview (N:M with User)
├── CourseBookmark (N:M with User)
├── CourseAnnouncement (1:N)
└── CourseAchievement (1:N)
    └── UserBadge (N:M with User)


## API Endpoint Structure

/api/courses
├── GET    - List courses (with filters)
├── POST   - Create course
└── [id]
    ├── GET    - Get course details
    ├── PUT    - Update course
    ├── DELETE - Delete course
    ├── /enroll
    │   └── POST - Enroll in course
    ├── /unenroll
    │   └── POST - Unenroll from course
    ├── /modules
    │   ├── GET  - List modules
    │   ├── POST - Create module
    │   └── [moduleId]
    │       ├── PUT    - Update module
    │       ├── DELETE - Delete module
    │       └── /chapters
    │           ├── GET  - List chapters
    │           └── POST - Create chapter
    ├── /chapters
    │   └── [chapterId]
    │       ├── PUT    - Update chapter
    │       ├── DELETE - Delete chapter
    │       ├── /complete
    │       │   └── POST - Mark complete
    │       └── /sections
    │           ├── GET  - List sections
    │           └── POST - Create section
    ├── /sections
    │   └── [sectionId]
    │       ├── PUT    - Update section
    │       └── DELETE - Delete section
    ├── /reviews
    │   ├── GET  - List reviews
    │   ├── POST - Create review
    │   └── [reviewId]
    │       ├── PUT    - Update review
    │       └── DELETE - Delete review
    ├── /bookmark
    │   ├── POST   - Add bookmark
    │   └── DELETE - Remove bookmark
    ├── /announcements
    │   ├── GET  - List announcements
    │   └── POST - Create announcement
    ├── /analytics
    │   └── GET - Course analytics (instructor)
    └── /students
        └── GET - Enrolled students (instructor)

/api/courses/quizzes
└── [quizId]
    ├── GET - Get quiz (randomized)
    └── /submit
        └── POST - Submit quiz attempt


## Component Hierarchy

### Student View
CourseGrid
└── CourseCard (multiple)
    ├── CourseImage
    ├── CourseTitle
    ├── InstructorInfo
    ├── RatingDisplay
    ├── EnrollButton
    └── ProgressBar

CourseDetails
├── CourseHeader
├── EnrollButton
├── ChapterList
├── ReviewsList
│   └── ReviewForm
└── DiscussionThread

LearningInterface
├── ChapterList (sidebar)
├── CoursePlayer
│   ├── VideoEmbed
│   ├── TextContent
│   ├── FileDownload
│   └── QuizComponent
└── DiscussionThread

### Instructor View
InstructorDashboard
├── CourseList
├── CreateCourseButton
└── AnalyticsSummary

CourseManagement
├── CourseEditor
├── ContentManager
│   ├── ModuleList
│   ├── ChapterList
│   └── SectionList
├── StudentList
└── AnnouncementManager


## Service Layer Architecture

course-operations.ts
├── createCourse()
├── fetchCourseList()
├── fetchCourseById()
├── modifyCourse()
├── removeCourse()
└── validateInstructorAccess()

progress-tracker.ts
├── enrollStudent()
├── unenrollStudent()
├── markChapterDone()
├── computeProgress()
├── checkCompletion()
└── fetchEnrollmentData()

quiz-handler.ts
├── shuffleArray() [Fisher-Yates]
├── randomizeQuiz()
├── submitAttempt()
├── gradeQuiz()
└── fetchAttemptHistory()

achievement-manager.ts
├── awardBadge()
├── checkCriteria()
├── initializeDefaultBadges()
└── fetchUserBadges()


## Data Flow Examples

### Course Enrollment Flow
1. Student clicks "Enroll" button
2. EnrollButton → POST /api/courses/[id]/enroll
3. API validates course status (published)
4. progress-tracker.enrollStudent() called
5. Database: Create CourseEnrollment record
6. Database: Increment course.enrollmentCount
7. Notification created for instructor
8. Response: enrollment data
9. UI updates: Show "Continue Learning"

### Quiz Taking Flow
1. Student opens quiz section
2. CoursePlayer → GET /api/courses/quizzes/[quizId]
3. quiz-handler.randomizeQuiz() called
4. Questions and answers shuffled (Fisher-Yates)
5. Mapping preserved for grading
6. Response: randomized quiz
7. Student submits answers
8. QuizComponent → POST /api/courses/quizzes/[quizId]/submit
9. quiz-handler.submitAttempt() called
10. quiz-handler.gradeQuiz() computes score
11. Check for achievement criteria
12. Response: score, correct answers, explanations
13. UI displays results

### Progress Tracking Flow
1. Student completes chapter
2. Button click → POST /api/courses/[id]/chapters/[chapterId]/complete
3. progress-tracker.markChapterDone() called
4. Database: Create/update ChapterProgress
5. progress-tracker.computeProgress() calculates %
6. Database: Update CourseEnrollment.progress
7. Check if course completed (100%)
8. If completed: award achievement
9. Create completion notification
10. Response: updated progress
11. UI updates: Progress bar, checkmarks


## Key Design Decisions

1. **Content Hierarchy**: Course → Module → Chapter → Section
   - Allows flexible organization
   - Supports reordering
   - Enables granular progress tracking

2. **Quiz Randomization**: Fisher-Yates shuffle algorithm
   - Prevents answer memorization
   - Fair randomization
   - Maintains question quality

3. **Progress Calculation**: Chapter-based percentage
   - Simple and clear
   - Non-linear navigation allowed
   - Automatic updates

4. **Review Requirement**: 30% completion
   - Prevents spam reviews
   - Ensures informed ratings
   - Enforced at API level

5. **Achievement System**: Criteria-based
   - Flexible badge definitions
   - Automatic awarding
   - User-controlled visibility

6. **Authorization**: Role-based
   - Instructors: Full course control
   - Students: Enrolled course access
   - Enforced on every API call


## Performance Considerations

1. **Pagination**: All list endpoints support pagination
2. **Indexes**: Database indexes on common queries
3. **Eager Loading**: Related data loaded efficiently
4. **Caching**: Ready for Redis/CDN integration
5. **Optimistic Updates**: UI updates before API confirmation


## Security Features

1. **Authentication**: NextAuth on all routes
2. **Authorization**: Instructor/student checks
3. **Input Validation**: Type checking with TypeScript
4. **SQL Injection**: Prevented by Prisma ORM
5. **XSS Protection**: React's built-in escaping
6. **CSRF**: NextAuth CSRF tokens


## Scalability

Ready for:
- Multiple instructors
- Thousands of courses
- Millions of enrollments
- Concurrent quiz attempts
- Real-time progress updates
- File upload scaling
- Video streaming integration


## Integration Points

- **NextAuth**: User authentication
- **Prisma**: Database ORM
- **MySQL**: Database backend
- **Radix UI**: Component library
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Existing Notification System**: Course notifications
- **Existing File Upload**: Course materials


## Future Enhancements (Not in Scope)

- Payment processing (Stripe integration)
- Live video classes (WebRTC)
- Certificate generation (PDF)
- Email notifications (SendGrid)
- Mobile apps (React Native)
- AI recommendations
- Advanced analytics (Google Analytics)
- Content recommendations
- Gamification enhancements
- Social learning features
