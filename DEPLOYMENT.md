# Canvas Digital Workspace - Deployment Guide

## 🚀 Production Deployment

This guide covers deploying Canvas Digital Workspace to production with all enterprise features.

## Prerequisites

- Node.js 18+ and pnpm
- Supabase account and project
- Domain name and SSL certificates
- CDN service (optional but recommended)

## Environment Configuration

### 1. Core Environment Variables

Create a `.env.production` file with the following variables:

```env
# Application
NODE_ENV=production
NUXT_APP_BASE_URL=https://your-domain.com

# Database
DATABASE_URL=file:./database/sqlite.db

# Supabase Configuration
NUXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Security
NUXT_SECRET_KEY=your-256-bit-secret-key
CSRF_SECRET=your-csrf-secret-key

# Performance Monitoring
PERFORMANCE_API_ENDPOINT=https://your-monitoring-service.com/api
PERFORMANCE_API_KEY=your-monitoring-api-key

# AI Services (Optional)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Email (for notifications)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password

# CDN Configuration
CDN_BASE_URL=https://your-cdn.com
STATIC_ASSETS_URL=https://your-cdn.com/assets
```

### 2. Supabase Setup

#### Authentication Configuration
1. Go to Supabase Dashboard → Authentication → Settings
2. Configure site URL: `https://your-domain.com`
3. Add redirect URLs:
   - `https://your-domain.com/auth/callback`
   - `https://your-domain.com/auth/reset-password`

#### Database Setup
1. Enable Row Level Security (RLS)
2. Run the SQL migrations from `/database/migrations/`
3. Set up database policies for security

#### Storage Configuration
1. Create buckets for user avatars and document attachments
2. Configure storage policies
3. Enable image optimization

### 3. Security Configuration

#### Content Security Policy
The CSP headers are configured in `server/middleware/security.ts`. Review and adjust for your domain:

```typescript
const csp = [
  "default-src 'self' https://your-domain.com",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://your-cdn.com",
  // ... additional CSP directives
].join('; ')
```

#### Rate Limiting
Review rate limits in `utils/security.ts` and adjust for production traffic:

```typescript
// Workspace creation: 10 requests per 15 minutes
// Document creation: 20 requests per 15 minutes
// Authentication: 5 requests per minute
```

## Build and Deployment

### 1. Build for Production

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Run database migrations
pnpm db:generate
pnpm db:migrate

# Build the application
pnpm build

# Preview the build (optional)
pnpm preview
```

### 2. Deployment Options

#### Option A: Node.js Server
```bash
# Start the production server
NODE_ENV=production pnpm start

# Or use PM2 for process management
pm2 start ecosystem.config.js
```

#### Option B: Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start"]
```

#### Option C: Vercel/Netlify
Canvas is optimized for serverless deployment. Simply connect your GitHub repository.

### 3. Reverse Proxy (Nginx)

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support for real-time features
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }
}
```

## Monitoring and Analytics

### 1. Performance Monitoring
The application includes built-in Web Vitals tracking. Configure your monitoring endpoint:

```env
PERFORMANCE_API_ENDPOINT=https://your-monitoring-service.com/api
PERFORMANCE_API_KEY=your-api-key
```

### 2. Error Tracking
Consider integrating with services like:
- Sentry for error tracking
- LogRocket for session recording
- DataDog for infrastructure monitoring

### 3. Analytics
Built-in performance analytics are available. Additional analytics can be configured:

```typescript
// In nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/google-analytics',
    // other modules
  ],
  googleAnalytics: {
    id: 'GA_MEASUREMENT_ID'
  }
})
```

## Database Management

### Production Database
For production, consider upgrading from SQLite to PostgreSQL:

1. Set up PostgreSQL instance
2. Update `DATABASE_URL` environment variable
3. Update Drizzle configuration in `database/index.ts`

```typescript
// For PostgreSQL
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const client = postgres(process.env.DATABASE_URL!)
export const db = drizzle(client, { schema })
```

### Backups
Set up automated database backups:

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > /backups/canvas_backup_$DATE.sql
```

## Security Checklist

- [ ] SSL certificates configured
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Rate limiting configured
- [ ] CSP headers set correctly
- [ ] CSRF protection enabled
- [ ] Input validation implemented
- [ ] Authentication flows tested
- [ ] File upload restrictions set
- [ ] Logging configured for security events

## Performance Optimization

### 1. CDN Configuration
Configure CDN for static assets:

```typescript
// In nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    storage: {
      assets: {
        driver: 's3',
        bucket: 'your-assets-bucket',
        region: 'us-east-1'
      }
    }
  }
})
```

### 2. Caching Strategy
- Enable Redis for session storage
- Configure HTTP caching headers
- Use CDN for static assets
- Implement database query caching

### 3. Image Optimization
The application includes image optimization. Configure for production:

```typescript
// In nuxt.config.ts
export default defineNuxtConfig({
  image: {
    provider: 'cloudinary', // or 'imagekit'
    cloudinary: {
      baseURL: 'https://res.cloudinary.com/your-cloud/image/upload/'
    }
  }
})
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL is correct
   - Check database server is running
   - Ensure migrations have been run

2. **Authentication Issues**
   - Verify Supabase configuration
   - Check redirect URLs are correct
   - Ensure secrets are properly set

3. **Performance Issues**
   - Enable compression in your proxy
   - Configure proper caching headers
   - Monitor Web Vitals metrics

4. **Real-time Features Not Working**
   - Check WebSocket configuration
   - Verify Socket.io setup
   - Ensure firewall allows connections

### Logs and Debugging

Enable detailed logging in production:

```env
DEBUG=canvas:*
LOG_LEVEL=info
```

Monitor application logs for issues and performance metrics.

## Support

For deployment issues or questions:
- Check the GitHub repository for latest updates
- Review the troubleshooting guide
- Contact the development team

---

**Last Updated**: December 2024
**Version**: PRD-v3