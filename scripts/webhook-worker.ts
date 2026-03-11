/**
 * Webhook Worker Entry Point
 *
 * Starts the direct HTTP webhook receiver that accepts Shopify webhook POSTs
 * and routes them through WebhookProcessor — with no GCP Pub/Sub dependency.
 *
 * Usage:
 *   Development:  npm run webhook-worker
 *   Production:   Set as Render worker service Start Command
 *
 * Environment Variables Required:
 *   SHOPIFY_API_SECRET  - Used for HMAC-SHA256 webhook signature validation
 *   DATABASE_URL        - Database connection string for Prisma
 *   SHOPIFY_APP_URL     - App URL (e.g. https://your-app.onrender.com) — required
 *                         because webhook handlers import shopify.server.ts which
 *                         initializes shopifyApp() at module load time.
 *   PORT                - HTTP port (injected automatically by Render; default 3001)
 */

import { startWebhookWorker } from "../app/services/webhook-worker.server";

console.log("=".repeat(60));
console.log("Starting Webhook Worker (direct HTTP receiver)");
console.log("=".repeat(60));
console.log();
console.log("Configuration:");
console.log(`  Port:               ${process.env.PORT ?? 3001}`);
console.log(`  Database:           ${process.env.DATABASE_URL ? "Connected" : "Missing"}`);
console.log(`  SHOPIFY_API_SECRET: ${process.env.SHOPIFY_API_SECRET ? "Loaded" : "Missing"}`);
console.log(`  SHOPIFY_APP_URL:    ${process.env.SHOPIFY_APP_URL ? process.env.SHOPIFY_APP_URL : "MISSING — worker will fail to start"}`);
console.log();
console.log("=".repeat(60));
console.log();

startWebhookWorker();
