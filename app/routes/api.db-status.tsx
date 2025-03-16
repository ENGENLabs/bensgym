import { json } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';
import { prisma } from '~/utils/db.server';
import { getEnv } from '~/utils/env.server';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get environment information
    const env = getEnv();
    
    // Perform a simple query to check connection
    const testResult = await prisma.$queryRaw`SELECT 1 as result`;
    
    // Get database version
    const versionResult = await prisma.$queryRaw`SELECT version() as version`;
    
    // Get connection info (without exposing sensitive data)
    const connectionInfo = {
      databaseUrlConfigured: Boolean(env.DATABASE_URL),
      prismaUrlConfigured: Boolean(env.POSTGRES_PRISMA_URL),
      directUrlConfigured: Boolean(env.POSTGRES_URL_NON_POOLING),
      nodeEnv: env.NODE_ENV,
      accelerateEnabled: Boolean(process.env.PRISMA_ACCELERATE_URL)
    };
    
    return json({
      status: 'connected',
      message: 'Database connection successful',
      version: Array.isArray(versionResult) && versionResult.length > 0 
        ? versionResult[0].version 
        : 'Unknown',
      connectionInfo,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    
    // Prepare error details
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    } : 'Unknown error';
    
    // Get environment information even if connection fails
    const env = getEnv();
    const connectionInfo = {
      databaseUrlConfigured: Boolean(env.DATABASE_URL),
      prismaUrlConfigured: Boolean(env.POSTGRES_PRISMA_URL),
      directUrlConfigured: Boolean(env.POSTGRES_URL_NON_POOLING),
      nodeEnv: env.NODE_ENV,
      accelerateEnabled: Boolean(process.env.PRISMA_ACCELERATE_URL)
    };
    
    return json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown database error',
      error: errorDetails,
      connectionInfo,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
