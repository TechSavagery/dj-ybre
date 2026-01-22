import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma Client configured for Neon serverless
 * 
 * IMPORTANT: Use Neon's connection pooling URL in your DATABASE_URL environment variable.
 * The pooling URL typically looks like:
 * postgresql://user:password@ep-xxx-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require
 * 
 * For migrations, you may also want to set DATABASE_URL_UNPOOLED to the direct connection URL
 * (without pooling) for better migration performance.
 */
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Prisma works directly with Neon's connection pooling URL
    // No adapter needed - just use the pooling URL in DATABASE_URL
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db













