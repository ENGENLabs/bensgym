# Deployment Guide: Vercel + Supabase

This guide provides step-by-step instructions for deploying the R-Fitness Gym Check-in System using Vercel and Supabase.

## Prerequisites

Before deploying, ensure you have:

1. A GitHub account with your project repository
2. A [Vercel](https://vercel.com) account (can sign up with GitHub)
3. A [Supabase](https://supabase.com) account
4. Square Developer account with API credentials

## Deployment Steps

### 1. Set Up Supabase Database

1. Log in to [Supabase](https://supabase.com)
2. Create a new project with a name like "rfitness"
3. Note your project URL and connection strings
4. In the SQL Editor, you can run migrations manually if needed

### 2. Configure Environment Variables

Create a `.env` file in the root directory with the following variables (based on `.env.example`):

```
# Application
NODE_ENV=development
SESSION_SECRET=your-secure-session-secret

# Database - Supabase Configuration
DATABASE_URL=postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
DIRECT_URL=postgres://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres

# Square API
SQUARE_ACCESS_TOKEN=your-square-access-token
SQUARE_LOCATION_ID=your-square-location-id
SQUARE_ENVIRONMENT=sandbox  # or production
SQUARE_WEBHOOK_SIGNATURE_KEY=your-webhook-signature-key
SQUARE_WEBHOOK_URL=https://your-vercel-app-name.vercel.app/api/webhook
```

### 3. Prepare Your Database

Run the database preparation script to set up your Supabase database:

```bash
node scripts/prepare-database.js
```

This will:
- Generate the Prisma client
- Push your schema to Supabase

### 4. Deploy to Vercel

1. Push your code to GitHub
2. Log in to [Vercel](https://vercel.com)
3. Click "Add New" > "Project"
4. Import your GitHub repository
5. Configure the project:
   - Framework Preset: Remix
   - Build Command: `npm run vercel-build`
   - Output Directory: `build/client`
   - Install Command: `npm install`

6. Add environment variables:
   - Copy all variables from your `.env` file
   - Make sure to update `NODE_ENV=production`
   - Update `SQUARE_WEBHOOK_URL` with your actual Vercel deployment URL

7. Click "Deploy"

### 5. Configure Square Webhooks

1. Log in to your [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Select your application
3. Navigate to the Webhooks section
4. Add a webhook subscription with the URL: `https://your-vercel-app-name.vercel.app/api/webhook`
5. Subscribe to the following event types:
   - `customer.created`
   - `customer.updated`
   - `customer.deleted`
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
6. Copy the Webhook Signature Key provided by Square
7. Update your Vercel environment variables with the `SQUARE_WEBHOOK_SIGNATURE_KEY` value

### 6. Verify the Application

Open your browser and navigate to your Vercel deployment URL. You should see the R-Fitness Gym Check-in System login page.

## Database Management

### Accessing the Database

You can access your Supabase database through:

1. The Supabase dashboard
2. Using the Supabase CLI
3. Using any PostgreSQL client with your connection string

### Backup and Restore

Supabase provides automated backups. You can also:

1. Export data through the Supabase dashboard
2. Use `pg_dump` with your connection string
3. Use the Supabase CLI for backups

## Monitoring and Logging

### Viewing Application Logs

Access logs through the Vercel dashboard:
1. Go to your project
2. Click on "Deployments"
3. Select the deployment
4. Click on "Functions" to see function logs

### Database Monitoring

Supabase provides monitoring tools:
1. Go to your Supabase project
2. Click on "Database"
3. View performance metrics and logs

### Application Monitoring

The application includes a built-in monitoring dashboard accessible at `/admin`. This dashboard provides:
1. Recent check-ins
2. System logs
3. Webhook status
4. Database connection status
5. Analytics data

## Updating the Application

To update the application:

1. Push changes to your GitHub repository
2. Vercel will automatically deploy the new version
3. If you've made schema changes, you may need to run migrations manually:
   ```bash
   npx prisma migrate deploy
   ```

## Troubleshooting

### Database Connection Issues

If the application cannot connect to the database:

1. Check your `DATABASE_URL` and `DIRECT_URL` environment variables in Vercel
2. Verify that your IP is allowed in Supabase's connection pooling settings
3. Check Supabase logs for any connection errors

### Webhook Issues

If webhooks aren't being received:

1. Verify your webhook URL in Square Developer Dashboard
2. Check that the webhook signature key is correctly set in environment variables
3. Check Vercel function logs for any webhook processing errors

### Deployment Failures

If deployment fails:

1. Check Vercel build logs for errors
2. Verify that all required environment variables are set
3. Make sure your Prisma schema is compatible with Supabase

## Performance Optimization

For better performance:

1. Consider using Prisma Accelerate for connection pooling
2. Enable Vercel Edge Functions for faster global response times
3. Use Supabase's connection pooling features
