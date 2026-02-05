# Drive API Routes Documentation

This document describes the Drive API routes for file and folder management.

## File Routes

### GET /api/drive/files
List files with pagination and filters.

**Query Parameters:**
- `folderId` (optional): Filter by folder ID
- `search` (optional): Search in file name and description
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Response:**
```json
{
  "files": [
    {
      "id": "string",
      "originalName": "string",
      "fileSize": "string",
      "mimeType": "string",
      "fileType": "string",
      "isPublic": "boolean",
      "tags": "array",
      "downloadCount": "number",
      "createdAt": "datetime",
      ...
    }
  ],
  "pagination": {
    "page": "number",
    "limit": "number",
    "total": "number",
    "totalPages": "number"
  }
}
```

### POST /api/drive/files
Upload a new file.

**Request (multipart/form-data):**
- `file` (required): File to upload (max 500MB)
- `folderId` (optional): Folder ID to upload to
- `description` (optional): File description
- `tags` (optional): JSON array of tags
- `isPublic` (optional): Make file public (default: false)

**Response:**
```json
{
  "file": {
    "id": "string",
    "originalName": "string",
    "fileSize": "string",
    "fileHash": "string",
    ...
  }
}
```

**Features:**
- 500MB file size limit
- Storage limit check (10GB per user)
- Duplicate detection using MD5 hash
- Files stored in `/uploads/drives/{userId}/{year}/{month}/`
- UUID-based filenames with original name preserved in database
- Activity log creation

### GET /api/drive/files/[id]
Download a file.

**Response:**
- File binary with appropriate headers
- `Content-Type`: File MIME type
- `Content-Disposition`: attachment with original filename

**Features:**
- Permission check (owner, public file, or public drive)
- Bandwidth tracking and limit enforcement (10GB daily)
- Download count increment
- Activity log creation

### PUT /api/drive/files/[id]
Update file metadata.

**Request Body:**
```json
{
  "originalName": "string (optional)",
  "description": "string (optional)",
  "tags": "array (optional)",
  "isPublic": "boolean (optional)"
}
```

**Response:**
```json
{
  "file": { /* updated file object */ }
}
```

### DELETE /api/drive/files/[id]
Delete a file (soft delete by default).

**Query Parameters:**
- `permanent` (optional): Permanently delete file (default: false)

**Soft Delete:**
- Moves file to trash (sets deletedAt timestamp)
- File can be restored later
- Storage quota not freed

**Permanent Delete:**
- Removes file from disk
- Removes database record
- Frees storage quota
- Cannot be undone

## Folder Routes

### GET /api/drive/folders
List folders with hierarchy.

**Query Parameters:**
- `parentId` (optional): Filter by parent folder ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)

**Response:**
```json
{
  "folders": [
    {
      "id": "string",
      "name": "string",
      "path": "string",
      "isPublic": "boolean",
      "children": "array",
      "files": "array",
      "subject": "object (optional)",
      ...
    }
  ],
  "pagination": { /* pagination info */ }
}
```

### POST /api/drive/folders
Create a new folder.

**Request Body:**
```json
{
  "name": "string (required)",
  "parentId": "string (optional)",
  "isPublic": "boolean (optional)",
  "subjectId": "string (optional)"
}
```

**Features:**
- Duplicate name check within same parent
- Automatic path generation
- Subject association support
- Activity log creation

### PUT /api/drive/folders/[id]
Update folder metadata.

**Request Body:**
```json
{
  "name": "string (optional)",
  "isPublic": "boolean (optional)"
}
```

**Features:**
- Duplicate name check
- Recursive path update for all children
- Activity log creation

### DELETE /api/drive/folders/[id]
Delete a folder (soft delete by default).

**Query Parameters:**
- `permanent` (optional): Permanently delete folder (default: false)

**Soft Delete:**
- Moves folder and all contents to trash
- Recursively soft deletes all subfolders and files
- Can be restored later

**Permanent Delete:**
- Removes all files from disk
- Removes all database records
- Frees storage quota
- Cannot be undone

## Authentication

All routes require authentication via NextAuth. The session must include a `user.id`.

## Error Responses

```json
{
  "error": "Error message"
}
```

**Common Status Codes:**
- 200: Success
- 201: Created
- 400: Bad request (validation error)
- 401: Unauthorized (not authenticated)
- 403: Forbidden (not authorized)
- 404: Not found
- 409: Conflict (duplicate)
- 429: Too many requests (bandwidth limit)
- 500: Internal server error

## Storage Limits

- User storage limit: 10GB
- File size limit: 500MB
- Daily bandwidth limit: 10GB (resets every 24 hours)
- Trash retention: 30 days

## Activity Logging

All operations create activity logs with:
- Action type (upload, download, delete, rename, move)
- Target type (file, folder)
- Target ID and name
- Metadata (varies by action)
- Timestamp

## File Storage Structure

```
/uploads/
  /drives/
    /{userId}/
      /{year}/
        /{month}/
          /{uuid}.{ext}
```

Example: `/uploads/drives/user123/2024/02/a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6.pdf`
