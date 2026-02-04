# Environment Configuration Guide

This repository contains environment configuration files for both development and production deployment.

## Environment Files

### `.env.production` (Production Configuration)
Contains the production environment variables for deployment at http://139.59.93.248.nip.io

**Configured settings:**
- ✅ Production MODE enabled
- ✅ NextAuth URL: `http://139.59.93.248.nip.io`
- ✅ Secure NextAuth Secret
- ✅ MySQL Database: `mysql://root:rootpassword@db:3306/studyhi`
- ✅ Pusher Real-time Configuration (App ID: 2107345)
- ✅ Google OAuth Credentials Configured

### `.env.local` (Development Configuration)
Contains the local development environment variables

**Configured settings:**
- Local SQLite database
- Development NextAuth secret
- localhost URL
- Optional OAuth and Pusher (commented out)

### `env.example` (Template)
Template file showing all available configuration options

## Authentication Configuration

The authentication system has been configured to:

1. **Support Google OAuth** - Fully configured with production credentials
2. **Support Credentials Login** - Email/password authentication
3. **Conditional Loading** - Google OAuth only loads when credentials are present
4. **Fallback Protection** - Application won't crash if environment variables are missing

## Usage

### For Production Deployment:
```bash
# Use the production environment file
cp .env.production .env

# Or set environment variables directly in your hosting platform
# All required variables are already configured in .env.production
```

### For Local Development:
```bash
# Use the local environment file  
cp .env.local .env

# Or create your own .env file with your preferences
```

## Production Deployment Details

### Database Configuration
- **Type**: MySQL
- **Host**: db (Docker service name)
- **Port**: 3306
- **Database**: studyhi
- **Credentials**: root/rootpassword

### Authentication
- **NextAuth URL**: http://139.59.93.248.nip.io
- **Strategy**: JWT-based
- **Session Duration**: 30 days
- **Google OAuth**: Enabled and configured

### Real-time Features (Pusher)
- **App ID**: 2107345
- **Key**: 03c8b458570215655ea3
- **Cluster**: ap2 (Asia Pacific)

### Google OAuth
- **Client ID**: 379796803716-0sjlagpgvuul9nbgmq0tes8lv836u4el.apps.googleusercontent.com
- **Authorized Redirect**: http://139.59.93.248.nip.io/api/auth/callback/google

## Security Notes

⚠️ **Important**:
- The `.env.production` file contains production secrets
- This file should be kept secure and not shared publicly
- Environment files (`.env*`) are in `.gitignore` to prevent accidental commits
- For production deployment, set these variables in your hosting platform's environment settings

## Testing the Configuration

### Verify Environment Variables
```bash
# Check that all required variables are set
node -e "require('dotenv').config(); console.log('DATABASE_URL:', !!process.env.DATABASE_URL); console.log('NEXTAUTH_SECRET:', !!process.env.NEXTAUTH_SECRET); console.log('GOOGLE_CLIENT_ID:', !!process.env.GOOGLE_CLIENT_ID);"
```

### Test Authentication
1. Start the application
2. Navigate to `/auth/login`
3. Try both login methods:
   - Email/Password (credentials)
   - Google OAuth

## Docker Deployment

The production configuration uses Docker networking:
- Database service name: `db`
- Application accessible at: http://139.59.93.248.nip.io

### Docker Compose
Ensure your `docker-compose.yml` includes:
```yaml
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: studyhi
    ports:
      - "3306:3306"
```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running: `docker ps | grep mysql`
- Check connection: `docker exec -it <container> mysql -u root -p`
- Verify database exists: `SHOW DATABASES;`

### Authentication Issues
- Check NEXTAUTH_URL matches your deployment URL
- Verify Google OAuth redirect URI is registered in Google Console
- Ensure NEXTAUTH_SECRET is set and has sufficient entropy

### Pusher Issues
- Verify Pusher credentials are correct
- Check cluster is set to 'ap2'
- Test connection in Pusher dashboard

## Quick Start

### Production:
```bash
# 1. Set environment
export NODE_ENV=production

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npx prisma generate

# 4. Run migrations
npx prisma db push

# 5. Start application
npm run start
```

### Development:
```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Start dev server
npm run dev
```

## Support

For issues or questions about environment configuration:
1. Check this guide
2. Review `.env.example` for all available options
3. Consult deployment guides in the `DEPLOYMENT-GUIDE.md`

---

**Last Updated**: February 3, 2026
**Configuration Type**: Production + Development
**Status**: ✅ Fully Configured
