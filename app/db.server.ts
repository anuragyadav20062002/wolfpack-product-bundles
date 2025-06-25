import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    })
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

