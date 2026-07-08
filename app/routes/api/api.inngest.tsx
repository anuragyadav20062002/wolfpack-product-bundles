/**
 * Inngest serve route — POST /api/inngest
 *
 * Inngest calls this endpoint to execute registered functions.
 * Also responds to GET for Dev Server introspection.
 *
 * Security: Inngest validates its own HMAC signature on every inbound request.
 * Set INNGEST_SIGNING_KEY in environment for production.
 * Dev Server (INNGEST_DEV=1) skips signature validation.
 */
import { serve } from "inngest/remix";
import { inngest } from "~/inngest/client";
import { webhookFunction } from "~/inngest/functions";

const handler = serve({
  client: inngest,
  functions: [webhookFunction],
});

export const action = handler;
export const loader = handler;
