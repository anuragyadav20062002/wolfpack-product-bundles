import { Inngest } from "inngest";
import type { ShopifyWebhookEvents } from "./types";

/**
 * Shared Inngest client.
 *
 * Used by:
 *  - Webhook worker  → inngest.send() to enqueue events
 *  - Remix app       → serve() to register functions at /api/inngest
 *
 * Dev mode: set INNGEST_DEV=1 to route events to the local Inngest Dev Server
 * (npx inngest-cli@latest dev) instead of Inngest Cloud. No signing key required.
 */
export const inngest = new Inngest<ShopifyWebhookEvents>({
  id: "wolfpack-bundles",
  ...(process.env.INNGEST_EVENT_KEY
    ? { eventKey: process.env.INNGEST_EVENT_KEY }
    : {}),
  ...(process.env.INNGEST_DEV === "1"
    ? { isDev: true }
    : {}),
});
