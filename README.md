# StudyPlanner - Academic Success Management System

## 🎯 Project Overview

StudyPlanner is a comprehensive, full-stack web application designed to help students organize their academic life. It's built with modern web technologies and follows best practices for scalability, maintainability, and user experience.

## 🏗️ Architecture Overview

This application follows a **Clean Architecture** pattern with clear separation of concerns:

- **Frontend**: Next.js 15 with App Router, React 18, TypeScript
- **Backend**: Next.js API Routes with Prisma ORM
- **Database**: SQLite (development) / MySQL (production)
- **Authentication**: NextAuth.js with JWT strategy
- **State Management**: React Hooks + Context API
- **Styling**: Tailwind CSS with shadcn/ui components
- **Testing**: Jest, Playwright, and comprehensive test coverage

## 🚀 Key Features

### Core Academic Management
- **Subject Management**: Create, organize, and track academic subjects with custom colors and descriptions
- **Task Management**: Comprehensive task system with priorities, due dates, and status tracking
- **Study Sessions**: Log and monitor study time with detailed notes and analytics
- **Test Marks**: Track exam performance and academic progress
- **Syllabus Management**: Organize course content and learning objectives
- **Timetable**: Visual calendar for scheduling and planning

### Advanced Features
- **Analytics Dashboard**: Comprehensive insights into study patterns and progress
- **File Management**: Document upload, preview, and organization system
- **Real-time Notifications**: Push notifications and real-time updates
- **Mobile Responsive**: Optimized for all device sizes
- **Dark/Light Theme**: User preference-based theming
- **Search & Filtering**: Advanced search across all data types

### Learning Management System (LMS) - NEW! 🎓
- **Course Creation**: Instructors can create comprehensive courses with modules, chapters, and sections
- **Content Delivery**: Support for text, video (YouTube/Vimeo), file uploads, and interactive quizzes
- **Enrollment System**: Students can browse, enroll, and track progress through courses
- **Progress Tracking**: Chapter-based completion tracking with percentage-based progress calculation
- **Quiz System**: Interactive quizzes with randomized questions, automatic grading, and multiple attempts
- **Review & Rating**: Students can rate and review courses (requires 30% completion)
- **Discussions**: Chapter-level Q&A forums for student-instructor interaction
- **Achievements**: Badge system rewarding course completion, quiz mastery, and learning milestones
- **Instructor Analytics**: Detailed insights into enrollments, completion rates, and student performance
- **Announcements**: Course-specific notifications from instructors to enrolled students
- **Bookmarks**: Save favorite courses for quick access

### Social Features
- **Global & Community Feeds**: Share updates, ask questions, and engage with peers.
- **Direct Messaging**: Real-time private chat with other users.
- **Media Support**: Post images, PDFs, and documents with rich previews.
- **Interactions**: Like posts, reply to comments (threaded), and follow users.
- **Communities**: Create and join study groups focused on specific topics.

### User Experience
- **Progressive Web App**: Offline capabilities and app-like experience
- **Drag & Drop**: Intuitive interface for task and file management
- **Keyboard Shortcuts**: Power user productivity features
- **Accessibility**: WCAG compliant with screen reader support

## 📁 Project Structure

```
study-planner/
├── 📁 app/                          # Next.js App Router (Main Application)
│   ├── 📁 api/                      # API Routes (Backend)
│   │   ├── 📁 auth/                 # Authentication endpoints
│   │   ├── 📁 subjects/             # Subject CRUD operations
│   │   ├── 📁 tasks/                # Task management
│   │   ├── 📁 study-sessions/       # Study session tracking
│   │   ├── 📁 test-marks/           # Test score management
│   │   ├── 📁 courses/              # LMS Course API (19 routes) NEW!
│   │   ├── 📁 migration/            # Data migration utilities
│   │   └── 📁 uploadthing/          # File upload handling
│   ├── 📁 auth/                     # Authentication pages
│   │   ├── login/                   # User login
│   │   ├── signup/                  # User registration
│   │   └── forgot-password/         # Password recovery
│   ├── 📁 dashboard/                # Main dashboard (71KB - Core component)
│   ├── 📁 subjects/                 # Subject management
│   ├── 📁 tasks/                    # Task management
│   ├── 📁 study-sessions/           # Study session tracking
│   ├── 📁 test-marks/               # Test performance tracking
│   ├── 📁 syllabus/                 # Course content management
│   ├── 📁 courses/                  # LMS Course Pages (10 pages) NEW!
│   │   ├── page.tsx                 # Course browse & search
│   │   ├── [slug]/                  # Course details & learning
│   │   ├── my-courses/              # Student enrolled courses
│   │   └── instructor/              # Instructor dashboard
│   ├── 📁 analytics/                # Data visualization (39KB)
│   ├── 📁 timetable/                # Calendar and scheduling
│   ├── 📁 profile/                  # User profile management
│   ├── 📁 settings/                 # Application settings
│   └── 📁 documents/                # File management system
├── 📁 components/                    # Reusable UI Components
│   ├── 📁 ui/                       # shadcn/ui component library
│   │   ├── button.tsx               # Button components
│   │   ├── dialog.tsx               # Modal dialogs
│   │   ├── form.tsx                 # Form components
│   │   ├── sidebar.tsx              # Navigation sidebar
│   │   └── [40+ more components]    # Complete UI component set
│   ├── 📁 dashboard/                # Dashboard-specific components
│   ├── 📁 subjects/                 # Subject management components
│   ├── 📁 tasks/                    # Task management components
│   ├── 📁 courses/                  # LMS Course Components (15 files) NEW!
│   │   ├── CourseCard.tsx           # Course preview cards
│   │   ├── CoursePlayer.tsx         # Video/content player
│   │   ├── QuizComponent.tsx        # Interactive quizzes
│   │   ├── ProgressBar.tsx          # Progress tracking
│   │   └── [11 more components]     # Complete LMS UI set
│   ├── 📁 analytics/                # Chart and visualization components
│   ├── 📁 study-sessions/           # Study session components
│   ├── 📁 test-marks/               # Test tracking components
│   ├── 📁 syllabus/                 # Syllabus management components
│   ├── 📁 notifications/            # Notification system
│   ├── 📁 calendar/                 # Calendar and scheduling
│   ├── 📁 providers/                # Context providers
│   │   ├── session-provider.tsx     # NextAuth session management
│   │   └── theme-provider.tsx       # Theme management
│   └── 📁 file-management/          # File handling components
├── 📁 hooks/                        # Custom React Hooks
│   ├── useSubjects.ts               # Subject data management
│   ├── useTasks.ts                  # Task data management
│   ├── useStudySessions.ts          # Study session management
│   ├── useTestMarks.ts              # Test mark management
│   ├── useMigration.ts              # Data migration utilities
│   ├── useNotifications.ts          # Notification management
│   ├── useCalendarEvents.ts         # Calendar event management
│   ├── useRecommendations.ts        # AI-powered recommendations
│   ├── useLocalStorage.ts           # Local storage utilities
│   └── [10+ more hooks]            # Complete hook ecosystem
├── 📁 lib/                          # Core Libraries and Utilities
│   ├── 📁 database/                 # Database layer
│   │   ├── database-service.ts      # Prisma client singleton
│   │   ├── subject-service.ts       # Subject business logic
│   │   ├── task-service.ts          # Task business logic
│   │   ├── study-session-service.ts # Study session logic
│   │   ├── test-mark-service.ts     # Test mark logic
│   │   └── migration-utility.ts     # Data migration tools
│   ├── 📁 courses/                  # LMS Services (4 files) NEW!
│   │   ├── course-operations.ts     # Course CRUD & management
│   │   ├── progress-tracker.ts      # Enrollment & progress
│   │   ├── quiz-handler.ts          # Quiz randomization & grading
│   │   └── achievement-manager.ts   # Badge system
│   ├── auth.ts                      # NextAuth configuration
│   ├── notifications.ts             # Notification system
│   ├── utils.ts                     # Utility functions
│   └── pusher.ts                    # Real-time communication
├── 📁 prisma/                       # Database Schema and Migrations
│   ├── schema.prisma                # Database schema definition
│   └── dev.db                       # SQLite development database
├── 📁 types/                        # TypeScript type definitions
├── 📁 utils/                        # Utility functions
├── 📁 styles/                       # Global styles and CSS
├── 📁 public/                       # Static assets
├── 📁 tests/                        # Test files
├── 📁 e2e/                          # End-to-end tests (Playwright)
├── 📁 __tests__/                    # Jest unit tests
├── 📁 coverage/                     # Test coverage reports
├── 📁 scripts/                      # Build and deployment scripts
└── 📁 .github/                      # GitHub Actions and workflows
```

## 🗄️ Database Schema

The application uses a relational database with the following core entities:

### Core Models
- **User**: Authentication and profile information
- **Subject**: Academic subjects with custom colors and descriptions
- **Task**: Assignments with priorities, due dates, and status
- **StudySession**: Time tracking for study activities
- **TestMark**: Exam scores and performance metrics
- **StudyGoal**: Academic goals and progress tracking
- **Chapter**: Course content organization
- **UserSettings**: User preferences and configurations

### LMS Models (NEW!)
- **Course**: Main course entity with pricing, ratings, and status
- **CourseModule**: Course sections/modules for content organization
- **CourseChapter**: Individual chapters within modules
- **CourseSection**: Content sections (video, text, files, quiz)
- **Quiz**: Quiz configuration with settings
- **QuizQuestion**: Individual quiz questions with answers
- **QuizAttempt**: Student quiz attempts with scores
- **CourseEnrollment**: Student enrollments with progress tracking
- **ChapterProgress**: Chapter-level completion tracking
- **CourseReview**: Course ratings and reviews (1-5 stars)
- **CourseBookmark**: Saved/favorited courses
- **CourseDiscussion**: Q&A discussions per chapter
- **CourseAnnouncement**: Instructor announcements
- **CourseAchievement**: Badge definitions
- **UserBadge**: User-earned badges

### Key Relationships
- User → Subjects (1:many)
- Subject → Tasks (1:many)
- Subject → StudySessions (1:many)
- Subject → TestMarks (1:many)
- User → DashboardSections (1:many)
- **User → Courses as Instructor (1:many)** NEW!
- **User → CourseEnrollments as Student (1:many)** NEW!
- **Course → Modules → Chapters → Sections (hierarchical)** NEW!
- **Quiz → QuizQuestions (1:many)** NEW!
- **CourseEnrollment → ChapterProgress (1:many)** NEW!

## 🔐 Authentication System

### NextAuth.js Configuration
- **Strategy**: JWT-based authentication
- **Provider**: Credentials (email/password)
- **Features**: Auto-registration, password hashing with bcrypt
- **Security**: Strong secret management, session validation

## 🎓 Learning Management System (LMS)

The StudyHi platform includes a comprehensive LMS that enables instructors to create and deliver courses, while students can enroll, learn, and track their progress.

### For Instructors

#### Course Creation & Management
- **Course Builder**: Create courses with hierarchical structure (Course → Modules → Chapters → Sections)
- **Content Types**: Add text, video embeds (YouTube/Vimeo), file uploads, and interactive quizzes
- **Draft System**: Work on courses privately before publishing
- **Flexible Pricing**: Set course as free or paid (pricing structure ready)
- **Rich Metadata**: Add descriptions, learning objectives, requirements, categories, and difficulty levels

#### Content Management
- **Modules**: Organize content into logical sections
- **Chapters**: Break down modules into digestible lessons
- **Sections**: Add multiple content types per chapter
- **Ordering**: Drag-and-drop or manual ordering of content
- **Preview Mode**: Test course before publishing

#### Student Management
- **Enrollment Tracking**: View all enrolled students
- **Progress Monitoring**: See completion status for each student
- **Performance Analytics**: Track quiz scores and chapter completion
- **Student List Export**: Download student data for records

#### Communication
- **Announcements**: Send course-wide notifications to enrolled students
- **Discussion Moderation**: Monitor and respond to student questions
- **Review Management**: View and delete inappropriate reviews

#### Analytics Dashboard
- **Enrollment Trends**: Track sign-ups over time
- **Completion Rates**: Monitor how many students finish the course
- **Quiz Performance**: Analyze average scores and difficult questions
- **Popular Content**: See which chapters students engage with most
- **Student Engagement**: Track activity patterns and dropoff points

### For Students

#### Course Discovery
- **Browse Catalog**: View all available published courses
- **Advanced Search**: Find courses by title, description, or instructor
- **Filter & Sort**: By category, difficulty, rating, price, or enrollment count
- **Course Preview**: View course details, curriculum, and instructor info before enrolling

#### Enrollment & Learning
- **Easy Enrollment**: One-click enrollment in published courses
- **My Courses**: Dashboard showing all enrolled courses with progress
- **Non-linear Learning**: Skip ahead or revisit any chapter
- **Content Player**: Watch videos, read text, download files
- **Progress Tracking**: Visual progress bar showing completion percentage

#### Interactive Features
- **Quizzes**: Take interactive quizzes with:
  - Randomized question order (prevents memorization)
  - Randomized answer options
  - Immediate feedback with explanations
  - Multiple attempts allowed
  - Score tracking and history
  - Timed mode (optional)

- **Discussions**: Ask questions per chapter:
  - Post questions and get instructor responses
  - Reply to other students
  - Upvote helpful discussions
  - Instructor badge for official answers

- **Reviews & Ratings**: Rate courses (requires 30% completion):
  - 1-5 star rating
  - Written review
  - Edit or delete your review
  - See aggregate ratings

#### Gamification
- **Achievement System**: Earn badges for:
  - First Course Completed
  - Quiz Master (100% quiz score)
  - Fast Learner (5 courses completed)
  - Dedicated Student (10 courses completed)
  - Discussion Helper (answer 10 questions)
  - Consistent Learner (7-day streak)

- **Bookmarks**: Save favorite courses for quick access
- **Progress Milestones**: Visual indicators at 25%, 50%, 75%, and 100%

### Technical Features

#### Quiz System
- **Fisher-Yates Shuffle**: Proper randomization algorithm for questions and answers
- **Answer Mapping**: Preserves correct answers during randomization
- **Automatic Grading**: Instant score calculation with detailed results
- **Attempt History**: Track all quiz attempts with timestamps
- **Pass/Fail Thresholds**: Configurable passing scores per quiz

#### Progress Calculation
- **Chapter-Based**: Progress calculated as (completed chapters / total chapters) × 100
- **Real-time Updates**: Progress bar updates immediately after chapter completion
- **Course Completion**: Automatic detection when 100% reached
- **Last Accessed**: Track when student last viewed each chapter

#### Content Delivery
- **Video Embeds**: Support for YouTube and Vimeo URLs
- **File Storage**: Upload and serve PDFs, documents, images
- **Text Editor**: Rich text support for written content
- **File Downloads**: Secure download links for course materials

#### Authorization & Access Control
- **Instructor Only**: Only course creators can edit their courses
- **Enrollment Required**: Students must enroll to access content
- **Published Only**: Only published courses visible to students
- **Review Eligibility**: 30% completion required to post reviews

### API Endpoints

The LMS exposes 19 RESTful API endpoints:

**Course Management**
- `GET /api/courses` - List courses (with filters)
- `POST /api/courses` - Create course
- `GET /api/courses/[id]` - Get course details
- `PUT /api/courses/[id]` - Update course
- `DELETE /api/courses/[id]` - Delete course

**Enrollment**
- `POST /api/courses/[id]/enroll` - Enroll in course
- `POST /api/courses/[id]/unenroll` - Unenroll from course

**Content Management**
- `GET/POST /api/courses/[id]/modules` - Module operations
- `PUT/DELETE /api/courses/[id]/modules/[moduleId]` - Module management
- `GET/POST /api/courses/[id]/modules/[moduleId]/chapters` - Chapter operations
- `PUT/DELETE /api/courses/[id]/chapters/[chapterId]` - Chapter management
- `GET/POST /api/courses/[id]/chapters/[chapterId]/sections` - Section operations
- `PUT/DELETE /api/courses/[id]/sections/[sectionId]` - Section management

**Progress**
- `POST /api/courses/[id]/chapters/[chapterId]/complete` - Mark chapter complete

**Reviews**
- `GET/POST /api/courses/[id]/reviews` - Review operations
- `PUT/DELETE /api/courses/[id]/reviews/[reviewId]` - Review management

**Instructor Features**
- `GET/POST /api/courses/[id]/announcements` - Announcements
- `GET /api/courses/[id]/analytics` - Course analytics
- `GET /api/courses/[id]/students` - Enrolled students

**Quizzes**
- `GET /api/courses/quizzes/[quizId]` - Get quiz (randomized)
- `POST /api/courses/quizzes/[quizId]/submit` - Submit attempt

**Bookmarks**
- `POST/DELETE /api/courses/[id]/bookmark` - Toggle bookmark

### Database Schema

The LMS uses 15 new Prisma models:
- Course, CourseModule, CourseChapter, CourseSection
- Quiz, QuizQuestion, QuizAttempt
- CourseEnrollment, ChapterProgress
- CourseReview, CourseBookmark
- CourseDiscussion, CourseAnnouncement
- CourseAchievement, UserBadge

All models include proper indexing for performance and foreign key constraints for data integrity.

### Setup Instructions

1. **Run Database Migration**:
   ```bash
   npx prisma db push
   # or
   npx prisma migrate dev --name add_courses_feature
   ```

2. **Access the LMS**:
   - **Browse Courses**: Navigate to `/courses`
   - **Instructor Dashboard**: Navigate to `/courses/instructor`
   - **My Courses**: Navigate to `/courses/my-courses`

3. **Create Your First Course**:
   - Go to `/courses/instructor`
   - Click "Create New Course"
   - Fill in course details
   - Add modules, chapters, and sections
   - Publish when ready

### Best Practices

#### For Instructors
- Start with a course outline (modules and chapters) before adding content
- Use clear, descriptive titles for chapters
- Mix content types (video + text + quiz) for engagement
- Add quizzes after every few chapters to reinforce learning
- Respond to student questions within 24-48 hours
- Post announcements for important updates
- Monitor analytics to identify difficult content

#### For Students
- Complete chapters in order for best learning experience
- Take notes while watching videos
- Attempt quizzes multiple times to master material
- Ask questions when stuck
- Leave honest reviews to help others
- Set learning goals and track progress

### Future Enhancements

Planned features for the LMS:
- **Payment Integration**: Stripe/PayPal for paid courses
- **Certificates**: Downloadable completion certificates
- **Live Sessions**: Video conferencing for real-time classes
- **Assignments**: Homework submissions and grading
- **Peer Review**: Student-to-student feedback
- **Course Bundles**: Package multiple courses together
- **Affiliate System**: Referral rewards for course promoters


### User Management
- **Registration**: Automatic user creation on first login
- **Password Security**: bcrypt hashing with salt rounds
- **Session Management**: JWT tokens with configurable expiration
- **Access Control**: Role-based permissions (future enhancement)

## 🎨 UI/UX Design

### Design System
- **Framework**: Tailwind CSS with custom design tokens
- **Component Library**: shadcn/ui for consistent, accessible components
- **Theme Support**: Dark/light mode with system preference detection
- **Responsive Design**: Mobile-first approach with breakpoint optimization

### Key UI Components
- **ProgressiveTaskManager**: Advanced task management interface
- **GlobalSearch**: Unified search across all data types
- **FileThumbnail**: Document preview and management
- **ExpandableSection**: Collapsible content areas
- **ThemeToggle**: Theme switching with smooth transitions

## 📊 Data Management

### State Management Strategy
- **Local State**: React useState for component-specific state
- **Global State**: Context API for shared application state
- **Server State**: Custom hooks for API data management
- **Caching**: Optimistic updates and intelligent data fetching

### Data Flow
1. **User Action** → Component
2. **Hook Call** → Custom hook (useSubjects, useTasks, etc.)
3. **API Request** → Next.js API route
4. **Database Operation** → Prisma ORM
5. **Response** → Hook state update
6. **UI Update** → Component re-render

## 🧪 Testing Strategy

### Testing Pyramid
- **Unit Tests**: Jest for business logic and utilities
- **Integration Tests**: API route testing and database operations
- **E2E Tests**: Playwright for user journey validation
- **Performance Tests**: Load testing and optimization validation

### Test Coverage
- **Components**: All major UI components tested
- **Hooks**: Custom hook logic validation
- **API Routes**: Endpoint functionality testing
- **Database**: Schema validation and migration testing

## 🚀 Deployment & Production

### Environment Configuration
- **Development**: SQLite database with local configuration
- **Production**: MySQL database with cPanel hosting
- **Environment Variables**: Secure configuration management
- **Build Optimization**: Next.js production builds with analysis

### Deployment Options
- **Vercel**: Optimized for Next.js applications
- **cPanel**: Traditional hosting with MySQL database
- **Docker**: Containerized deployment option
- **GitHub Actions**: Automated CI/CD pipeline

## 🔧 Development Workflow

### Setup Instructions
1. **Clone Repository**: `git clone [repository-url]`
2. **Install Dependencies**: `npm install`
3. **Environment Setup**: Copy `.env.example` to `.env.local`
4. **Database Setup**: `npx prisma generate && npx prisma db push`
5. **Development Server**: `npm run dev`

### Key Commands
- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Testing**: `npm run test:all`
- **Linting**: `npm run lint:fix`
- **Type Checking**: `npm run type-check`

## 📈 Performance & Optimization

### Frontend Optimization
- **Code Splitting**: Dynamic imports and route-based splitting
- **Image Optimization**: Next.js Image component with WebP support
- **Bundle Analysis**: Webpack bundle analyzer integration
- **Lazy Loading**: Component and route lazy loading

### Backend Optimization
- **Database Indexing**: Optimized queries with proper indexing
- **Connection Pooling**: Efficient database connection management
- **Caching Strategy**: Intelligent data caching and invalidation
- **API Optimization**: Rate limiting and request validation

## 🔒 Security Features

### Data Protection
- **Input Validation**: Comprehensive form validation and sanitization
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Protection**: Content Security Policy and input sanitization
- **CSRF Protection**: NextAuth.js built-in CSRF protection

### Authentication Security
- **Password Hashing**: bcrypt with configurable salt rounds
- **Session Management**: Secure JWT token handling
- **Rate Limiting**: API endpoint protection
- **Environment Security**: Secure secret management

## 🌟 Future Enhancements

### Planned Features
- **Social Features**: Study groups and collaboration
- **AI Integration**: Smart study recommendations
- **Mobile App**: React Native application
- **Offline Support**: Progressive Web App enhancements
- **Analytics**: Advanced reporting and insights

### Technical Improvements
- **Microservices**: Service-oriented architecture
- **Real-time Sync**: WebSocket integration
- **Performance**: Advanced caching and optimization
- **Scalability**: Horizontal scaling capabilities

## 🤝 Contributing

### Development Guidelines
- **Code Style**: ESLint and Prettier configuration
- **Type Safety**: Strict TypeScript configuration
- **Testing**: Comprehensive test coverage requirements
- **Documentation**: Inline code documentation and README updates

### Code Quality
- **Linting**: ESLint with Next.js and React rules
- **Formatting**: Prettier for consistent code style
- **Type Checking**: TypeScript strict mode enabled
- **Git Hooks**: Pre-commit validation and formatting

## 📚 Technical Stack

### Frontend Technologies
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.x
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State Management**: React Hooks + Context

### Backend Technologies
- **Runtime**: Node.js 18+
- **Framework**: Next.js API Routes
- **Database**: Prisma ORM
- **Authentication**: NextAuth.js
- **Validation**: Zod schema validation

### Development Tools
- **Package Manager**: npm
- **Testing**: Jest + Playwright
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript
- **Build Tool**: Webpack (Next.js)

### Database & Storage
- **Development**: SQLite
- **Production**: MySQL
- **ORM**: Prisma
- **Migrations**: Prisma Migrate
- **File Storage**: Local + Cloud options

## 🎯 Use Cases

### Primary Users
- **Students**: Academic organization and progress tracking
- **Teachers**: Student progress monitoring
- **Educational Institutions**: Academic management system
- **Self-Learners**: Personal development tracking

### Key Scenarios
1. **Course Management**: Organize subjects and track progress
2. **Assignment Tracking**: Manage tasks with deadlines and priorities
3. **Study Planning**: Schedule and log study sessions
4. **Performance Analysis**: Monitor test scores and academic growth
5. **Document Organization**: File management and syllabus tracking

## 📊 Application Metrics

### Code Statistics
- **Total Lines**: 50,000+ lines of code
- **Components**: 100+ reusable UI components
- **Hooks**: 15+ custom React hooks
- **API Routes**: 20+ backend endpoints
- **Database Models**: 10+ Prisma models

### Performance Metrics
- **Bundle Size**: Optimized for production
- **Load Time**: < 2 seconds initial load
- **Database Queries**: Optimized with proper indexing
- **API Response**: < 200ms average response time

## 🔍 Troubleshooting

### Common Issues
1. **Authentication Errors**: Check NEXTAUTH_SECRET configuration
2. **Database Connection**: Verify DATABASE_URL and Prisma setup
3. **Build Errors**: Clear .next folder and reinstall dependencies
4. **Type Errors**: Run `npm run type-check` for validation

### Debug Mode
- **Frontend**: React DevTools and console logging
- **Backend**: API route debugging and database logging
- **Database**: Prisma Studio for data inspection
- **Network**: Browser DevTools for API monitoring

---

This StudyPlanner application represents a comprehensive solution for academic management, built with modern web technologies and following industry best practices. It provides a robust foundation for educational technology applications while maintaining excellent user experience and developer productivity.
