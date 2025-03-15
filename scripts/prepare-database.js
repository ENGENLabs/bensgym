#!/usr/bin/env node
/**
 * This script helps prepare your Supabase database for deployment
 * Run with: node scripts/prepare-database.js
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

// Check if .env file exists
const envPath = path.join(rootDir, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found. Please create one based on .env.example');
  process.exit(1);
}

console.log('🔄 Preparing database for deployment...');

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit', cwd: rootDir });

  // Push schema to database
  console.log('🚀 Pushing schema to Supabase...');
  execSync('npx prisma db push', { stdio: 'inherit', cwd: rootDir });

  console.log('✅ Database preparation complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Verify your database schema in Supabase');
  console.log('2. Deploy your application to Vercel');
} catch (error) {
  console.error('❌ Error preparing database:', error.message);
  process.exit(1);
}
