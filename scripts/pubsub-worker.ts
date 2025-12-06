/**
 * Pub/Sub Worker Entry Point
 *
 * Starts the Google Cloud Pub/Sub worker to pull and process webhook messages
 *
 * Usage:
 * - Development: npm run pubsub-worker
 * - Production: This should run as a separate worker process/service
 *
 * Environment Variables Required:
 * - GOOGLE_CLOUD_PROJECT: GCP project ID (e.g., "light-quest-455608-i3")
 * - PUBSUB_SUBSCRIPTION: Subscription name (e.g., "wolfpack-webhooks-subscription")
 * - GOOGLE_APPLICATION_CREDENTIALS_JSON: Service account credentials JSON string
 * - DATABASE_URL: Database connection string for Prisma
 */

import { startPubSubWorker } from "../app/services/pubsub-worker.server";

console.log("=".repeat(60));
console.log("Starting Pub/Sub Worker");
console.log("=".repeat(60));
console.log();
console.log("Configuration:");
console.log(`  Project: ${process.env.GOOGLE_CLOUD_PROJECT}`);
console.log(`  Subscription: ${process.env.PUBSUB_SUBSCRIPTION}`);
console.log(`  Credentials: ${process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? "Loaded" : "Missing"}`);
console.log(`  Database: ${process.env.DATABASE_URL ? "Connected" : "Missing"}`);
console.log();
console.log("=".repeat(60));
console.log();

// Start the worker
startPubSubWorker();
