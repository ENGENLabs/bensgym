# Migration Plan: Docker to Vercel+Supabase

This document outlines the step-by-step process for migrating the R-Fitness Gym Check-in System from Docker to Vercel+Supabase.

## Migration Steps

### 1. Database Migration

- [x] Update Prisma schema to support Supabase
- [x] Add `directUrl` for Prisma migrations on Vercel
- [ ] Create Supabase project and note connection details
- [ ] Run database migration script (`scripts/prepare-database.js`)
- [ ] Verify database schema in Supabase

### 2. Environment Configuration

- [x] Update `.env.example` with Supabase connection strings
- [ ] Create new `.env` file with Supabase credentials (do not commit to repo)
- [ ] Prepare environment variables for Vercel deployment

### 3. Application Adjustments

- [x] Create optimized Prisma client setup for serverless (`db.server.ts`)
- [x] Update webhook handling for Vercel's serverless functions
- [x] Add Vercel configuration file (`vercel.json`)
- [x] Update build scripts in `package.json`

### 4. Deployment Process

- [ ] Push code to GitHub repository
- [ ] Connect repository to Vercel
- [ ] Configure build settings in Vercel
- [ ] Set up environment variables in Vercel
- [ ] Deploy application
- [ ] Verify deployment works correctly

### 5. Square Integration Updates

- [ ] Update webhook URL in Square Developer Dashboard
- [ ] Test webhook functionality
- [ ] Verify membership verification works correctly

### 6. Testing and Verification

- [ ] Test check-in functionality
- [ ] Test admin dashboard
- [ ] Verify real-time updates via polling
- [ ] Test webhook processing
- [ ] Verify database operations

## Post-Migration Tasks

- [ ] Update documentation
- [ ] Remove Docker-specific files if no longer needed
- [ ] Set up monitoring for Vercel and Supabase
- [ ] Configure custom domain (if applicable)

## Rollback Plan

In case of migration issues:

1. Keep Docker configuration files as backup
2. Document database schema for potential rollback
3. Be prepared to revert to Docker deployment if necessary

## Benefits of Migration

1. **Simplified Deployment**: Vercel provides a streamlined deployment process with automatic previews for each PR
2. **Improved Performance**: Vercel's global edge network improves application responsiveness
3. **Reduced Maintenance**: No need to manage Docker containers and infrastructure
4. **Cost Efficiency**: Potentially lower costs with Vercel's free tier and Supabase's generous limits
5. **Better Developer Experience**: Easier debugging and monitoring through Vercel's dashboard
