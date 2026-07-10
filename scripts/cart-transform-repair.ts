#!/usr/bin/env tsx

import db from "../app/db.server";
import { CartTransformService } from "../app/services/cart-transform-service.server";
import {
  parseCartTransformRepairEnv,
  runCartTransformRepair,
} from "../app/services/cart-transform-repair.server";
import { unauthenticated } from "../app/shopify.server";

async function main() {
  const options = parseCartTransformRepairEnv(process.env);
  const summary = await runCartTransformRepair(options, {
    prisma: db as any,
    getAdmin: async (shopDomain) => {
      const { admin } = await unauthenticated.admin(shopDomain);
      return admin;
    },
    completeSetup: CartTransformService.completeSetup as any,
    logger: console,
  });

  console.log(JSON.stringify(summary, null, 2));

  if (summary.failedShops > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
