import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

let prisma: PrismaClient;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// Prisma Client configuration with connection pool settings
const prismaClientOptions: Prisma.PrismaClientOptions = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: (process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"]) as Prisma.LogLevel[],
};

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient(prismaClientOptions);
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient(prismaClientOptions);
  }
  prisma = global.__prisma!;
}

export { prisma };
export default prisma;
