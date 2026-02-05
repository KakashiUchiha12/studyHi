# Production Deployment Instructions

## Environment Configuration

The production environment has been fully configured with the following credentials:

### Server Information
- **Deployment URL**: http://139.59.93.248.nip.io
- **Node Environment**: production
- **Database Host**: db (Docker service)

### Database Configuration
- **Type**: MySQL 8
- **Host**: db:3306
- **Database**: studyhi
- **Credentials**: root / rootpassword

### Authentication
- **NextAuth URL**: http://139.59.93.248.nip.io
- **Strategy**: JWT-based sessions
- **Session Duration**: 30 days

### Google OAuth
- **Status**: ✅ Configured and Ready
- **Client ID**: [Available in .env.production file]
- **Authorized Redirect**: http://139.59.93.248.nip.io/api/auth/callback/google

### Pusher (Real-time Features)
- **Status**: ✅ Configured
- **App ID**: 2107345
- **Cluster**: ap2 (Asia Pacific)

## How to Deploy

### Option 1: Using Existing .env.production File
The `.env.production` file has been created locally with all the production credentials:

```bash
# 1. Ensure .env.production exists (it should be created automatically)
ls -la .env.production

# 2. Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# 3. Run database migrations
docker-compose exec app npx prisma db push

# 4. Verify deployment
curl http://139.59.93.248.nip.io
```

### Option 2: Set Environment Variables in Hosting Platform
If deploying to a hosting platform (Vercel, Netlify, etc.):

1. Copy values from `.env.production`
2. Add them to your platform's environment variable settings
3. Deploy

### Option 3: Manual Environment File Creation
```bash
# 1. Copy the template
cp env.production.template .env.production

# 2. Edit with actual values (provided separately via secure channel):
nano .env.production

# The values are stored in the local .env.production file
# Copy from there or request them from the repository administrator
```

## Docker Deployment

### Docker Compose Configuration
Ensure your `docker-compose.prod.yml` includes:

```yaml
version: '3.8'

services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: studyhi
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - db

volumes:
  mysql_data:
```

### Deployment Steps
```bash
# 1. Build and start containers
docker-compose -f docker-compose.prod.yml up -d --build

# 2. Check logs
docker-compose logs -f app

# 3. Run migrations
docker-compose exec app npx prisma db push

# 4. Create initial user (optional)
docker-compose exec app npx prisma studio
```

## Verification Steps

### 1. Check Application Health
```bash
curl http://139.59.93.248.nip.io
# Should return the application homepage
```

### 2. Test Authentication
- Visit: http://139.59.93.248.nip.io/auth/login
- Try credentials login with any email/password
- Try Google OAuth login

### 3. Test Database Connection
```bash
docker-compose exec db mysql -u root -p
# Password: rootpassword
# Then: USE studyhi; SHOW TABLES;
```

### 4. Test Pusher Connection
- Open browser console
- Navigate to a page with real-time features
- Check for Pusher connection logs

## Troubleshooting

### Application Won't Start
```bash
# Check logs
docker-compose logs app

# Common issues:
# 1. Database not ready - wait 30 seconds and restart
# 2. Missing environment variables - verify .env.production exists
# 3. Port conflict - ensure port 3000 is available
```

### Database Connection Failed
```bash
# Verify database is running
docker-compose ps

# Check database logs
docker-compose logs db

# Test connection
docker-compose exec db mysql -u root -p
```

### Google OAuth Not Working
1. Verify redirect URI in Google Console:
   - Should be: `http://139.59.93.248.nip.io/api/auth/callback/google`
2. Check NEXTAUTH_URL matches deployment URL
3. Ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set

### Pusher Issues
1. Verify credentials in Pusher dashboard
2. Check cluster is set to 'ap2'
3. Test connection at: https://pusher.com/docs/channels/getting_started/javascript

## Post-Deployment Checklist

- [ ] Application accessible at http://139.59.93.248.nip.io
- [ ] Database connected and tables created
- [ ] Credentials login working
- [ ] Google OAuth login working
- [ ] Real-time features (Pusher) working
- [ ] Environment variables properly set
- [ ] SSL/HTTPS configured (recommended for production)

## Security Recommendations

1. **Enable HTTPS**: Configure SSL certificate for production
2. **Firewall**: Restrict database port (3306) to internal network only
3. **Rotate Secrets**: Change NEXTAUTH_SECRET regularly
4. **Monitor Logs**: Set up log monitoring and alerts
5. **Backup Database**: Configure automated database backups
6. **Update Dependencies**: Keep packages up to date

## Environment Files Summary

- **`.env.production`** - Contains actual production credentials (NOT in git)
- **`.env.local`** - Contains development credentials (NOT in git)
- **`env.production.template`** - Template with placeholders (IN git)
- **`ENV-CONFIG-GUIDE.md`** - Comprehensive configuration guide (IN git)
- **`PRODUCTION-DEPLOYMENT.md`** (this file) - Deployment instructions (IN git)

## Support

For deployment issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables are set correctly
3. Review this deployment guide
4. Check the ENV-CONFIG-GUIDE.md for detailed configuration help

---

**Status**: ✅ Production Environment Fully Configured
**Last Updated**: February 3, 2026
**Deployment URL**: http://139.59.93.248.nip.io
