# Study Drive Setup Guide

This guide will help you set up and deploy the Study Drive feature.

## Prerequisites

- Node.js 18+ installed
- MySQL database configured
- Environment variables set up (DATABASE_URL, NEXTAUTH_SECRET, etc.)

## Step 1: Apply Database Schema Changes

Run Prisma migration to apply the new Drive models:

```bash
# Generate Prisma client with new models
npx prisma generate

# Push schema changes to database (for development)
npx prisma db push

# OR create a migration (for production)
npx prisma migrate dev --name add-drive-models
```

## Step 2: Initialize Drives for Existing Users

Run the migration script to create drives for all existing users:

```bash
node scripts/initialize-drives.js
```

This will:
- Check all existing users
- Create a Drive entry for each user who doesn't have one
- Set default limits (10GB storage, 10GB daily bandwidth)
- Show a summary of created drives

## Step 3: Create Upload Directory

Create the directory structure for file uploads:

```bash
mkdir -p uploads/drives
chmod 755 uploads/drives
```

Make sure your web server has write permissions to this directory.

## Step 4: Install Dependencies (if needed)

The following dependencies should already be in package.json:
- `react-dropzone` - For file upload
- `@prisma/client` - Database access
- `next-auth` - Authentication
- `@tanstack/react-query` - Data fetching

If not installed, run:

```bash
npm install react-dropzone @tanstack/react-query
```

## Step 5: Build and Start

Build the application:

```bash
npm run build
```

Start the application:

```bash
# Development
npm run dev

# Production
npm start
```

## Step 6: Test Drive Functionality

1. **Login to the application**
   - Navigate to `/auth/login`

2. **Access Drive**
   - Click "Drive" button on dashboard
   - Or go to `/drive`

3. **Test File Upload**
   - Drag and drop files into the upload zone
   - Or click to select files
   - Verify files appear in the grid

4. **Test Folder Creation**
   - Click "New Folder" button
   - Enter folder name
   - Verify folder is created

5. **Test Download**
   - Click on a file
   - Verify download starts
   - Check bandwidth is tracked

6. **Test Storage Indicator**
   - Upload files
   - Verify storage usage updates
   - Check progress bar reflects usage

7. **Test Trash**
   - Delete a file
   - Navigate to trash (if implemented)
   - Restore the file

## Environment Variables

Add these to your `.env` file if not already present:

```bash
# Database
DATABASE_URL="mysql://user:password@localhost:3306/studyhi"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# File Upload
MAX_FILE_SIZE=524288000  # 500MB in bytes
UPLOAD_DIR="./uploads/drives"
```

## Troubleshooting

### Database Connection Error
```
Error: Can't reach database server
```
**Solution:** Check DATABASE_URL in `.env` and ensure MySQL is running.

### File Upload Fails
```
Error: ENOENT: no such file or directory
```
**Solution:** Create the upload directory and set proper permissions:
```bash
mkdir -p uploads/drives
chmod -R 755 uploads
```

### Storage Counter Not Updating
**Solution:** Check that the Drive record exists for the user:
```sql
SELECT * FROM drives WHERE user_id = 'USER_ID';
```

### Bandwidth Limit Error
**Solution:** Bandwidth resets every 24 hours automatically. To manually reset:
```bash
# Run in MySQL
UPDATE drives SET bandwidth_used = 0, bandwidth_reset = DATE_ADD(NOW(), INTERVAL 24 HOUR);
```

### Prisma Client Not Generated
```
Error: @prisma/client did not initialize yet
```
**Solution:** Run prisma generate:
```bash
npx prisma generate
```

## Production Deployment

### Additional Steps for Production:

1. **Set up HTTPS**
   - Configure SSL certificates
   - Update NEXTAUTH_URL to use https://

2. **Configure File Storage**
   - Consider using cloud storage (S3, Google Cloud Storage)
   - Update file paths in API routes
   - Set up CDN for file delivery

3. **Set up Cron Jobs**
   - Clean up trash after 30 days
   - Monitor storage usage
   - Send storage warning emails

4. **Optimize Performance**
   - Enable database indexing
   - Set up Redis cache
   - Configure CDN
   - Enable compression

5. **Monitor and Backup**
   - Set up database backups
   - Monitor storage usage
   - Set up error logging (Sentry, LogRocket)
   - Monitor bandwidth usage

## Security Checklist

- [x] Authentication required on all Drive routes
- [x] User ownership validation
- [x] File path traversal prevention
- [x] SQL injection protection (Prisma)
- [x] Input sanitization
- [x] Error message sanitization
- [ ] Set up rate limiting
- [ ] Add virus scanning for uploaded files
- [ ] Implement file encryption at rest
- [ ] Set up audit logging

## Next Features to Implement

1. **UI Enhancements**
   - Right-click context menu
   - Drag-and-drop file organization
   - Thumbnail generation for images/PDFs
   - File preview modal

2. **Social Features**
   - Profile page integration
   - Feed page document search
   - Copy request notifications
   - Public document discovery

3. **Subject Integration**
   - Link subjects to drive folders
   - "View in Drive" button
   - Automatic folder creation for subjects
   - Migrate existing subject files

4. **Advanced Features**
   - File versioning
   - Collaborative folders
   - Share links with expiration
   - Advanced search filters

## Support

For issues or questions:
- Check DRIVE-IMPLEMENTATION-SUMMARY.md for implementation details
- Review API documentation in DRIVE-API-ROUTES.md
- Check security analysis in DRIVE-API-SECURITY.md
