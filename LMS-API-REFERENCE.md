# LMS API Quick Reference

## Course Management

### List Courses
```
GET /api/courses?category=&difficulty=&search=&page=1&pageSize=12
```

### Create Course
```
POST /api/courses
Body: { title, category, description, ... }
Auth: Required (Instructor)
```

### Get Course Details
```
GET /api/courses/[id]
Returns: Full course with modules, chapters, sections, reviews
```

### Update Course
```
PUT /api/courses/[id]
Body: { title, description, status, ... }
Auth: Required (Instructor - own courses only)
```

### Delete Course
```
DELETE /api/courses/[id]
Auth: Required (Instructor - own courses only)
```

## Enrollment

### Enroll in Course
```
POST /api/courses/[id]/enroll
Auth: Required
Awards: Enrollment badges
Notification: Created
```

### Unenroll from Course
```
POST /api/courses/[id]/unenroll
Auth: Required
```

## Modules

### List Modules
```
GET /api/courses/[id]/modules
Returns: All modules with chapters and sections
```

### Create Module
```
POST /api/courses/[id]/modules
Body: { title, description, order? }
Auth: Required (Instructor)
```

### Update Module
```
PUT /api/courses/[id]/modules/[moduleId]
Body: { title, description, order }
Auth: Required (Instructor)
```

### Delete Module
```
DELETE /api/courses/[id]/modules/[moduleId]
Auth: Required (Instructor)
```

## Chapters

### List Chapters
```
GET /api/courses/[id]/modules/[moduleId]/chapters
Returns: Chapters with sections
```

### Create Chapter
```
POST /api/courses/[id]/modules/[moduleId]/chapters
Body: { title, description, isFree, order? }
Auth: Required (Instructor)
```

### Update Chapter
```
PUT /api/courses/[id]/chapters/[chapterId]
Body: { title, description, isFree, order }
Auth: Required (Instructor)
```

### Delete Chapter
```
DELETE /api/courses/[id]/chapters/[chapterId]
Auth: Required (Instructor)
```

### Mark Chapter Complete
```
POST /api/courses/[id]/chapters/[chapterId]/complete
Auth: Required (Enrolled student)
Updates: Progress percentage
Awards: Completion badges (if course finished)
```

## Sections

### List Sections
```
GET /api/courses/[id]/chapters/[chapterId]/sections
Returns: Sections with quiz details
```

### Create Section
```
POST /api/courses/[id]/chapters/[chapterId]/sections
Body: { 
  title, 
  contentType: "text|video|file",
  content?, 
  videoUrl?, 
  fileUrl?,
  order?
}
Auth: Required (Instructor)
```

### Update Section
```
PUT /api/courses/[id]/sections/[sectionId]
Body: { title, content, videoUrl, ... }
Auth: Required (Instructor)
```

### Delete Section
```
DELETE /api/courses/[id]/sections/[sectionId]
Auth: Required (Instructor)
```

## Reviews

### List Reviews
```
GET /api/courses/[id]/reviews?page=1&pageSize=10
Returns: Reviews with user info, pagination
```

### Create Review
```
POST /api/courses/[id]/reviews
Body: { rating: 1-5, comment? }
Auth: Required (Enrolled student)
Requirement: 30% course completion
Limit: One review per student per course
```

### Update Review
```
PUT /api/courses/[id]/reviews/[reviewId]
Body: { rating, comment }
Auth: Required (Own review only)
```

### Delete Review
```
DELETE /api/courses/[id]/reviews/[reviewId]
Auth: Required (Own review only)
```

## Bookmarks

### Bookmark Course
```
POST /api/courses/[id]/bookmark
Auth: Required
```

### Remove Bookmark
```
DELETE /api/courses/[id]/bookmark
Auth: Required
```

## Announcements

### List Announcements
```
GET /api/courses/[id]/announcements
Returns: Announcements ordered by newest first
```

### Create Announcement
```
POST /api/courses/[id]/announcements
Body: { title, content }
Auth: Required (Instructor)
Notification: Sent to all enrolled students
```

## Analytics & Students

### Course Analytics
```
GET /api/courses/[id]/analytics
Auth: Required (Instructor only)
Returns: {
  totalEnrollments,
  completedEnrollments,
  completionRate,
  averageProgress,
  recentEnrollments
}
```

### List Students
```
GET /api/courses/[id]/students?page=1&pageSize=50
Auth: Required (Instructor only)
Returns: Enrolled students with progress
```

## Quizzes

### Get Quiz
```
GET /api/courses/quizzes/[quizId]
Auth: Required (Enrolled student)
Returns: Quiz with randomized questions and answers
Note: Correct answers excluded
```

### Submit Quiz
```
POST /api/courses/quizzes/[quizId]/submit
Body: { 
  answers: { 
    questionId: [answerIndex1, answerIndex2, ...],
    ...
  },
  timeTaken?: seconds
}
Auth: Required (Enrolled student)
Returns: {
  attemptId,
  score,
  totalQuestions,
  correctAnswers,
  isPassed,
  results? (if showAnswers enabled)
}
Awards: Quiz badges (if eligible)
```

## Authentication

All protected endpoints require:
```javascript
Authorization: NextAuth session cookie
```

Check authentication status:
```javascript
const session = await getServerSession(authOptions)
const userId = (session?.user as any)?.id
```

## Authorization Levels

1. **Public**: Course listing (published only), course details
2. **Authenticated**: Bookmarks
3. **Enrolled Student**: Course content, progress, quizzes, reviews
4. **Instructor**: Create/edit own courses, analytics, student list
5. **Course Owner**: Full CRUD on own courses

## Error Responses

```json
{
  "error": "Error message"
}
```

Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (not authenticated)
- 403: Forbidden (not authorized)
- 404: Not Found
- 500: Internal Server Error

## Common Patterns

### Pagination
```
?page=1&pageSize=20
```

### Filtering
```
?category=programming&difficulty=intermediate&minPrice=0&maxPrice=100
```

### Sorting
```
?sortBy=createdAt&sortOrder=desc
```

### Including Relations
Automatically included based on route:
- Courses include: instructor, modules, chapters
- Reviews include: user info
- Progress includes: chapter details

## Data Validation

### Course Creation
- Required: title, category
- Optional: description, price, difficulty, language

### Review Creation
- Required: rating (1-5)
- Validation: Must have 30% completion
- Constraint: One review per student per course

### Module/Chapter/Section
- Required: title
- Order: Auto-calculated if not provided

### Quiz Submission
- Required: answers object
- Format: { questionId: [indices] }
- Validation: Must be enrolled in course

## Progress Calculation

Progress = (completedChapters / totalChapters) * 100

Updates triggered by:
- POST /chapters/[chapterId]/complete

Course marked complete when progress = 100%

## Badge Award Triggers

- **Enrollment**: POST /enroll
- **Completion**: When progress reaches 100%
- **Quiz**: After quiz submission with high score

## Notification Events

- Course enrollment
- New announcements
- (Discussion replies - handled by discussions API)

## Best Practices

1. Always check enrollment before accessing course content
2. Use pagination for large datasets
3. Update course statistics after enrollment/review changes
4. Award badges asynchronously after major events
5. Validate instructor ownership before modifications
6. Cache course details when possible
7. Use transactions for critical operations
8. Log errors for debugging

## Testing Endpoints

Use tools like:
- Postman
- curl
- Thunder Client (VS Code)
- Insomnia

Example curl:
```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -d '{"title":"My Course","category":"programming"}' \
  --cookie "session=..."
```

## Integration Examples

### Frontend Course List
```typescript
const response = await fetch('/api/courses?category=programming&page=1')
const { courses, totalPages } = await response.json()
```

### Enroll Student
```typescript
const response = await fetch(`/api/courses/${courseId}/enroll`, {
  method: 'POST'
})
const enrollment = await response.json()
```

### Submit Quiz
```typescript
const answers = {
  'question-id-1': [0, 2], // Multiple choice
  'question-id-2': [1]      // Single choice
}

const response = await fetch(`/api/courses/quizzes/${quizId}/submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ answers, timeTaken: 300 })
})

const result = await response.json()
console.log(`Score: ${result.score}%`)
```
