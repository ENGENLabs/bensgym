# Supabase-Vercel Connection Setup Guide

## Problem
Vercel deployments can't connect to the Supabase database due to IP restrictions.

## Solution Options

### Option 1: Enable External Connections in Supabase
1. Go to the [Supabase Dashboard](https://app.supabase.com)
2. Select your project (rfitness-vercel)
3. Go to Project Settings > Database
4. Look for "Network Restrictions" or "Connection Settings"
5. Enable "IPv4 Auth" or any setting that allows connections from external IPs

### Option 2: Add SSL Mode to Connection Strings
Add `?sslmode=require` to your connection strings in Vercel environment variables:

```
DATABASE_URL=postgresql://postgres:mLIDRPMuga9eAKsJ@db.avoexdbabziwgtwicvtl.supabase.co:5432/postgres?sslmode=require
DIRECT_URL=postgresql://postgres:mLIDRPMuga9eAKsJ@db.avoexdbabziwgtwicvtl.supabase.co:5432/postgres?sslmode=require
```

### Option 3: Use Prisma Accelerate (Recommended for Serverless)
Prisma Accelerate is designed specifically for serverless environments like Vercel:

1. Sign up at [https://cloud.prisma.io/](https://cloud.prisma.io/)
2. Follow the setup instructions to get your Accelerate connection string
3. Update your Vercel environment variables:
   - `DATABASE_URL`: Your Prisma Accelerate connection string
   - `DIRECT_URL`: Your direct Supabase connection string

## Vercel IP Addresses
If you need to allowlist specific IPs, here are Vercel's IP ranges:

- 76.76.21.0/24

## Troubleshooting Tips
1. **Check Database Password**: Ensure the password in your connection string is correct
2. **Verify Database Exists**: Make sure the database has been created and tables are set up
3. **Test Locally**: Try connecting to the database from your local machine to verify credentials
4. **Check Vercel Logs**: After deployment, check the function logs for specific error messages
