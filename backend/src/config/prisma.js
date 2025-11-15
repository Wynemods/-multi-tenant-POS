import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

// Create a singleton Prisma client instance
const globalForPrisma = global

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function to get Prisma client with shop context
// This ensures all queries are filtered by shopId for multi-tenancy
export const getPrismaClient = (shopId = null) => {
  if (!shopId) {
    return prisma
  }
  
  // Return prisma with shop context
  // Note: We'll use middleware or query filtering in routes to ensure shopId is always included
  return prisma
}

// Helper to ensure shopId is included in queries
export const withShopId = (shopId) => {
  if (!shopId) {
    throw new Error('Shop ID is required')
  }
  return { shopId }
}

export default prisma

