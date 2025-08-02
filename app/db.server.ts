import { PrismaClient } from "@prisma/client";
import { PrismaClient as PrismaClientEdge } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

let prisma: PrismaClient | PrismaClientEdge;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClientEdge().$extends(withAccelerate()) as any;
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient().$extends(withAccelerate()) as any;
  }
  prisma = global.__prisma;
}

export { prisma };
export default prisma;
