import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { PrismaClient as PrismaClientEdge } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

let prisma: PrismaClient | PrismaClientEdge

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClientEdge().$extends(withAccelerate()) as any
} else {
  if (!global.__prisma) {
    const connectionString = process.env.DIRECT_URL
    if (!connectionString) {
      throw new Error(
        'DIRECT_URL is not set. Please add it to your .env file for local development.'
      )
    }
    const adapter = new PrismaPg({ connectionString })
    global.__prisma = new PrismaClient({ adapter })
  }
  prisma = global.__prisma
}

prisma.$use(async (params, next) => {
  try {
    return await next(params)
  } catch (error) {
    if (error instanceof Error) {
      console.error('Database error:', {
        model: params.model,
        action: params.action,
        error: error.message,
      })
    }
    throw error
  }
})

export { prisma }
export default prisma

