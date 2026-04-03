/**
 * HTTP Webhook Worker Server
 *
 * Receives Shopify webhook POSTs directly via HTTP, validates the HMAC
 * signature, adapts the payload to the existing PubSubMessage format,
 * and delegates to WebhookProcessor — with zero changes to the processor.
 *
 * Replaces the Google Cloud Pub/Sub subscriber (pubsub-worker.server.ts).
 *
 * Routes:
 *   GET  /health    → 200 {"status": "ok"} (no auth required)
 *   POST /webhooks  → HMAC-validate → process → 200
 *   *               → 404
 *
 * Environment Variables:
 *   PORT               - HTTP port to bind (default: 3001, injected by Render)
 *   SHOPIFY_API_SECRET - Required; used for HMAC-SHA256 signature validation
 *   DATABASE_URL       - Required by Prisma (already present on Render worker)
 */

import { createServer, type IncomingHttpHeaders, type IncomingMessage, type ServerResponse, type Server } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import { AppLogger } from "../lib/logger";
import { inngest } from "../inngest/client";
import { WebhookProcessor } from "./webhooks/processor.server";
import type { ShopifyWebhookEventData } from "../inngest/types";

// ---------------------------------------------------------------------------
// Inngest availability check — when event key is missing and not in dev mode,
// fall back to direct processing so webhooks are not silently dropped.
// ---------------------------------------------------------------------------
const INNGEST_AVAILABLE = !!(process.env.INNGEST_EVENT_KEY || process.env.INNGEST_DEV === "1");

// ---------------------------------------------------------------------------
// Environment validation — fail fast at import time so the process never binds
// ---------------------------------------------------------------------------
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;

if (!SHOPIFY_API_SECRET) {
  throw new Error(
    "[webhook-worker] SHOPIFY_API_SECRET environment variable is required. " +
      "Set it in the Render worker service environment variables."
  );
}

const PORT = Number(process.env.PORT ?? 3001);

// ---------------------------------------------------------------------------
// HMAC validation
// ---------------------------------------------------------------------------

/**
 * Validates the X-Shopify-Hmac-Sha256 header against the raw request body.
 *
 * Shopify computes HMAC-SHA256(rawBody, SHOPIFY_API_SECRET) and base64-encodes
 * it. We replicate that computation and use constant-time comparison to avoid
 * timing attacks.
 *
 * @returns true if the signature is valid, false otherwise
 */
function validateHmac(rawBody: Buffer, hmacHeader: string, secret: string): boolean {
  const digest = createHmac("sha256", secret).update(rawBody).digest("base64");

  const a = Buffer.from(hmacHeader);
  const b = Buffer.from(digest);

  // timingSafeEqual requires equal-length buffers; length mismatch = invalid
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// PubSubMessage adapter
// ---------------------------------------------------------------------------

/**
 * Builds the Inngest event payload from the raw Shopify webhook body and headers.
 */
function buildInngestPayload(rawBody: Buffer, headers: IncomingHttpHeaders): ShopifyWebhookEventData {
  const payload: ShopifyWebhookEventData = {
    rawPayload:  rawBody.toString("base64"),
    topic:       headers["x-shopify-topic"]       as string,
    shopDomain:  headers["x-shopify-shop-domain"] as string,
  };
  const webhookId  = headers["x-shopify-webhook-id"]  as string | undefined;
  const apiVersion = headers["x-shopify-api-version"] as string | undefined;
  if (webhookId  !== undefined) payload.webhookId  = webhookId;
  if (apiVersion !== undefined) payload.apiVersion = apiVersion;
  return payload;
}

// ---------------------------------------------------------------------------
// Raw body reader
// ---------------------------------------------------------------------------

/**
 * Reads the full request body as a Buffer.
 * Required so we can HMAC-validate the raw bytes before any JSON parsing.
 */
function readRawBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// ---------------------------------------------------------------------------
// HTTP server state (module-level so stopWebhookWorker() can close it)
// ---------------------------------------------------------------------------

let httpServer: Server | null = null;

// ---------------------------------------------------------------------------
// Request handler (exported for unit testing)
// ---------------------------------------------------------------------------

/**
 * Handles a single HTTP request. Exported so unit tests can exercise the
 * full request lifecycle without starting the HTTP server.
 */
export async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const method = req.method ?? "GET";
  const url    = req.url   ?? "/";

  // -------------------------------------------------------------------------
  // GET /health
  // -------------------------------------------------------------------------
  if (method === "GET" && url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // -------------------------------------------------------------------------
  // POST /webhooks
  // -------------------------------------------------------------------------
  if (method === "POST" && url === "/webhooks") {
    let rawBody: Buffer;

    try {
      rawBody = await readRawBody(req);
    } catch (error) {
      AppLogger.error("Failed to read request body", {
        component: "webhook-worker",
        operation: "requestHandler",
      }, error);
      res.writeHead(500);
      res.end();
      return;
    }

    // Reject empty bodies
    if (rawBody.length === 0) {
      AppLogger.warn("Rejected webhook with empty body", {
        component: "webhook-worker",
        operation: "requestHandler",
      });
      res.writeHead(400);
      res.end();
      return;
    }

    // HMAC validation
    const hmacHeader = req.headers["x-shopify-hmac-sha256"] as string | undefined;

    if (!hmacHeader) {
      AppLogger.error("Rejected webhook: missing X-Shopify-Hmac-Sha256 header", {
        component: "webhook-worker",
        operation: "validateHmac",
      }, {
        topic:  req.headers["x-shopify-topic"],
        shop:   req.headers["x-shopify-shop-domain"],
        method,
        url,
      });
      res.writeHead(401);
      res.end();
      return;
    }

    if (!validateHmac(rawBody, hmacHeader, SHOPIFY_API_SECRET!)) {
      AppLogger.error("Rejected webhook: invalid HMAC signature", {
        component: "webhook-worker",
        operation: "validateHmac",
      }, {
        topic:  req.headers["x-shopify-topic"],
        shop:   req.headers["x-shopify-shop-domain"],
      });
      res.writeHead(401);
      res.end();
      return;
    }

    // Required header validation
    const topic      = req.headers["x-shopify-topic"]       as string | undefined;
    const shopDomain = req.headers["x-shopify-shop-domain"] as string | undefined;

    if (!topic || !shopDomain) {
      AppLogger.warn("Rejected webhook: missing required headers", {
        component: "webhook-worker",
        operation: "requestHandler",
      }, { topic, shop: shopDomain });
      res.writeHead(400);
      res.end();
      return;
    }

    AppLogger.info("Received webhook", {
      component: "webhook-worker",
      operation: "requestHandler",
    }, {
      topic,
      shop:      shopDomain,
      webhookId: req.headers["x-shopify-webhook-id"],
      bodyBytes: rawBody.length,
    });

    // Acknowledge Shopify immediately (must be within 5-second window).
    // Inngest receives the event durably; retries are managed by Inngest Cloud.
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ received: true }));

    // Enqueue to Inngest after the response is sent.
    // If Inngest is not available (no event key and not dev mode), fall back to
    // direct processing so webhooks are not silently dropped.
    if (INNGEST_AVAILABLE) {
      inngest.send({
        name: "shopify/webhook",
        data: buildInngestPayload(rawBody, req.headers),
      }).then(() => {
        AppLogger.info("Webhook enqueued to Inngest", {
          component: "webhook-worker",
          operation: "requestHandler",
        }, { topic, shop: shopDomain });
      }).catch((error: unknown) => {
        AppLogger.error("Failed to enqueue webhook to Inngest", {
          component: "webhook-worker",
          operation: "requestHandler",
        }, error);
      });
    } else {
      // Fallback: process webhook directly (no Inngest retries, but data is not lost)
      const payload = buildInngestPayload(rawBody, req.headers);
      AppLogger.warn("Inngest unavailable — processing webhook directly (no retries)", {
        component: "webhook-worker",
        operation: "requestHandler",
      }, { topic, shop: shopDomain });
      WebhookProcessor.processPubSubMessage({
        data: payload.rawPayload,
        attributes: {
          "X-Shopify-Topic": payload.topic,
          "X-Shopify-Shop-Domain": payload.shopDomain,
          ...(payload.webhookId !== undefined && { "X-Shopify-Webhook-Id": payload.webhookId }),
          ...(payload.apiVersion !== undefined && { "X-Shopify-API-Version": payload.apiVersion }),
        },
      }).catch((error: unknown) => {
        AppLogger.error("Direct webhook processing failed", {
          component: "webhook-worker",
          operation: "requestHandler",
        }, error);
      });
    }

    return;
  }

  // -------------------------------------------------------------------------
  // 405 for wrong method on known paths, 404 for everything else
  // -------------------------------------------------------------------------
  if (url === "/webhooks" && method !== "POST") {
    res.writeHead(405, { Allow: "POST" });
    res.end();
    return;
  }

  res.writeHead(404);
  res.end();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Starts the HTTP webhook receiver.
 *
 * Binds to PORT (default 3001) and handles:
 *   GET  /health   → 200 {"status": "ok"}
 *   POST /webhooks → HMAC validate → inngest.send() → 200
 *   *              → 404
 *
 * Registers SIGTERM handler for graceful shutdown (waits up to 10 s for
 * in-flight requests before forcing process.exit).
 */
export function startWebhookWorker(): void {
  if (httpServer) {
    AppLogger.warn("Webhook worker already started, ignoring duplicate call", {
      component: "webhook-worker",
      operation: "startWebhookWorker",
    });
    return;
  }

  httpServer = createServer(handleRequest);

  httpServer.listen(PORT, () => {
    AppLogger.info("Webhook worker HTTP server started", {
      component: "webhook-worker",
      operation: "startWebhookWorker",
    }, { port: PORT });
  });

  // Graceful SIGTERM shutdown
  process.on("SIGTERM", () => {
    AppLogger.info("Received SIGTERM, shutting down gracefully", {
      component: "webhook-worker",
      operation: "shutdown",
    });

    const SHUTDOWN_TIMEOUT_MS = 10_000;

    const forceExit = setTimeout(() => {
      AppLogger.error("Shutdown timeout exceeded, forcing exit", {
        component: "webhook-worker",
        operation: "shutdown",
      });
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    // clearTimeout so the timer doesn't keep the event loop alive if server
    // closes before the timeout
    forceExit.unref();

    if (httpServer) {
      httpServer.close((err) => {
        if (err) {
          AppLogger.error("Error during HTTP server close", {
            component: "webhook-worker",
            operation: "shutdown",
          }, err);
          clearTimeout(forceExit);
          process.exit(1);
        }

        AppLogger.info("Webhook worker stopped", {
          component: "webhook-worker",
          operation: "shutdown",
        });
        clearTimeout(forceExit);
        process.exit(0);
      });
    } else {
      clearTimeout(forceExit);
      process.exit(0);
    }
  });

  AppLogger.info("Webhook worker started and listening for Shopify webhook POSTs", {
    component: "webhook-worker",
    operation: "startWebhookWorker",
  }, { port: PORT, endpoint: `POST /webhooks`, health: `GET /health` });
}

/**
 * Stops the HTTP webhook worker server.
 * Primarily used in tests; production shutdown is handled via SIGTERM.
 */
export function stopWebhookWorker(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!httpServer) {
      resolve();
      return;
    }

    AppLogger.info("Stopping webhook worker", {
      component: "webhook-worker",
      operation: "stopWebhookWorker",
    });

    httpServer.close((err) => {
      httpServer = null;
      if (err) {
        AppLogger.error("Error stopping webhook worker", {
          component: "webhook-worker",
          operation: "stopWebhookWorker",
        }, err);
        reject(err);
      } else {
        AppLogger.info("Webhook worker stopped", {
          component: "webhook-worker",
          operation: "stopWebhookWorker",
        });
        resolve();
      }
    });
  });
}
