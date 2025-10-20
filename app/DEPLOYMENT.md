# Production Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Configuration ✅
- [ ] Copy `.env.production.template` to `.env.production`
- [ ] Fill in all production environment variables
- [ ] Verify database connection string
- [ ] Configure Google OAuth credentials
- [ ] Set up AWS services (S3, SES, SNS)
- [ ] Configure Sentry for error monitoring
- [ ] Set secure JWT and encryption keys

### 2. Database Setup ✅
- [ ] Set up production MySQL database
- [ ] Run database migrations: `npm run db:migrate`
- [ ] Verify database connectivity
- [ ] Set up automated backups
- [ ] Configure read replicas (if needed)

### 3. Security Configuration ✅
- [ ] Verify HTTPS is enforced
- [ ] Configure security headers in `next.config.js`
- [ ] Review Content Security Policy
- [ ] Set up secure session configuration
- [ ] Enable HIPAA compliance logging
- [ ] Configure CORS policies

### 4. Performance Optimization ✅
- [ ] Enable output: 'standalone' in next.config.js
- [ ] Configure image optimization domains
- [ ] Set up CDN for static assets
- [ ] Enable compression and minification
- [ ] Configure caching strategies

### 5. Monitoring & Logging ✅
- [ ] Health check endpoint: `/api/health`
- [ ] Set up error monitoring (Sentry)
- [ ] Configure application logs
- [ ] Set up performance monitoring
- [ ] Database monitoring
- [ ] Set up alerts for critical metrics

### 6. Testing ✅
- [ ] Run full test suite: `npm run test`
- [ ] Run E2E tests: `npm run test:e2e`
- [ ] Performance testing
- [ ] Security testing
- [ ] Load testing (optional)

## Deployment Steps

### Option 1: Docker Deployment

```bash
# 1. Build the Docker image
docker build -t honey-rae-aesthetics:latest .

# 2. Run the container
docker run -d \
  --name honey-rae-app \
  -p 3000:3000 \
  --env-file .env.production \
  honey-rae-aesthetics:latest

# 3. Verify deployment
curl http://localhost:3000/api/health
```

### Option 2: Node.js Deployment

```bash
# 1. Install production dependencies
npm ci --only=production

# 2. Build the application
npm run build

# 3. Start the application
NODE_ENV=production npm start
```

### Option 3: Vercel Deployment

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy to Vercel
vercel --prod

# 3. Configure environment variables in Vercel dashboard
```

## Post-Deployment Verification

### 1. Health Checks
- [ ] Application starts successfully
- [ ] Health endpoint returns 200: `/api/health`
- [ ] Database connectivity verified
- [ ] Authentication system working
- [ ] Core workflows functional

### 2. Security Verification
- [ ] HTTPS working correctly
- [ ] Security headers present
- [ ] Authentication redirects working
- [ ] CORS policies enforced
- [ ] No sensitive data exposed

### 3. Performance Verification
- [ ] Page load times < 3 seconds
- [ ] API responses < 1 second
- [ ] Image optimization working
- [ ] Caching headers present
- [ ] Gzip compression enabled

### 4. Functionality Testing
- [ ] User registration/login
- [ ] Workflow creation and editing
- [ ] Template system working
- [ ] API endpoints responsive
- [ ] Error handling working

## Monitoring & Maintenance

### Daily Tasks
- [ ] Check application health
- [ ] Review error logs
- [ ] Monitor performance metrics
- [ ] Check database health

### Weekly Tasks
- [ ] Review security logs
- [ ] Update dependencies (if needed)
- [ ] Performance analysis
- [ ] Backup verification

### Monthly Tasks
- [ ] Security audit
- [ ] Performance optimization
- [ ] Database maintenance
- [ ] Cost analysis

## Rollback Plan

If deployment fails:

1. **Immediate Rollback**
   ```bash
   # Docker rollback
   docker stop honey-rae-app
   docker run -d --name honey-rae-app-rollback previous-image:tag
   
   # Vercel rollback
   vercel rollback [deployment-url]
   ```

2. **Database Rollback**
   ```bash
   # Restore from backup
   mysql -u user -p database_name < backup_file.sql
   ```

3. **DNS Rollback**
   - Update DNS to point to previous deployment
   - Verify old version is functioning

## Production URLs

- **Application**: `https://your-domain.com`
- **Health Check**: `https://your-domain.com/api/health`
- **Admin Panel**: `https://your-domain.com/admin`
- **API Documentation**: `https://your-domain.com/api/docs`

## Support Contacts

- **DevOps Team**: devops@your-company.com
- **Database Admin**: dba@your-company.com
- **Security Team**: security@your-company.com
- **On-call Engineer**: +1-xxx-xxx-xxxx

## Emergency Procedures

### Application Down
1. Check health endpoint
2. Review application logs
3. Check database connectivity
4. Verify infrastructure status
5. Initiate rollback if needed

### Database Issues
1. Check database connectivity
2. Review slow query logs
3. Monitor database metrics
4. Contact DBA team
5. Consider read-only mode

### Security Incident
1. Isolate affected systems
2. Contact security team
3. Preserve evidence
4. Implement fixes
5. Document incident

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Reviewed By**: Development Team