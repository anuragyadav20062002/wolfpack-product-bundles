#!/usr/bin/env tsx

import db from "../app/db.server";
import { unauthenticated } from "../app/shopify.server";
import {
  parseDeploymentBackfillEnv,
  runDeploymentBackfill,
} from "../app/services/deployment-backfill.server";
import { syncBundleStorefrontNow } from "../app/services/bundles/storefront-sync.server";

async function main() {
  const options = parseDeploymentBackfillEnv(process.env);
  const summary = await runDeploymentBackfill(options, {
    prisma: db as any,
    getAdmin: async (shopDomain) => {
      const { admin } = await unauthenticated.admin(shopDomain);
      return admin;
    },
    syncBundle: syncBundleStorefrontNow as any,
    logger: console,
  });

  console.log(JSON.stringify(summary, null, 2));

  if (summary.failedBundles > 0) {
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
