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

import { createServer, type IncomingHttpHeaders, type Server } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import { WebhookProcessor } from "./webhook-processor.server";
import { AppLogger } from "../lib/logger";
import type { PubSubMessage } from "./webhooks/types";

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
 * Converts a raw Shopify HTTP webhook request into the existing PubSubMessage
 * format so WebhookProcessor.processPubSubMessage() can be called unchanged.
 */
function adaptShopifyWebhook(rawBody: Buffer, headers: IncomingHttpHeaders): PubSubMessage {
  return {
    data: rawBody.toString("base64"),
    attributes: {
      "X-Shopify-Topic":       headers["x-shopify-topic"]       as string,
      "X-Shopify-Shop-Domain": headers["x-shopify-shop-domain"] as string,
      "X-Shopify-Webhook-Id":  headers["x-shopify-webhook-id"]  as string | undefined,
      "X-Shopify-API-Version": headers["x-shopify-api-version"] as string | undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// Raw body reader
// ---------------------------------------------------------------------------

/**
 * Reads the full request body as a Buffer.
 * Required so we can HMAC-validate the raw bytes before any JSON parsing.
 */
function readRawBody(req: import("node:http").IncomingMessage): Promise<Buffer> {
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
// Public API
// ---------------------------------------------------------------------------

/**
 * Starts the HTTP webhook receiver.
 *
 * Binds to PORT (default 3001) and handles:
 *   GET  /health   → 200 {"status": "ok"}
 *   POST /webhooks → HMAC validate → adapt → process → 200
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

  httpServer = createServer(async (req, res) => {
    const method = req.method ?? "GET";
    const url    = req.url   ?? "/";

    // -----------------------------------------------------------------------
    // GET /health
    // -----------------------------------------------------------------------
    if (method === "GET" && url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }

    // -----------------------------------------------------------------------
    // POST /webhooks
    // -----------------------------------------------------------------------
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

      // Non-null assertion is safe: validated above
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

      // Adapt to PubSubMessage and process — always respond 200 to avoid
      // Shopify retry storms even when processor fails
      const message = adaptShopifyWebhook(rawBody, req.headers);

      // Return 200 immediately before awaiting processor, so Shopify gets its
      // acknowledgement within the 5-second window
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ received: true }));

      // Process asynchronously after the response has been sent
      WebhookProcessor.processPubSubMessage(message).then((result) => {
        if (result.success) {
          AppLogger.info("Webhook processed successfully", {
            component: "webhook-worker",
            operation: "requestHandler",
          }, { topic, shop: shopDomain });
        } else {
          AppLogger.error("Webhook processor returned failure", {
            component: "webhook-worker",
            operation: "requestHandler",
          }, { topic, shop: shopDomain, error: result.error });
        }
      }).catch((error) => {
        AppLogger.error("Unhandled error in webhook processor", {
          component: "webhook-worker",
          operation: "requestHandler",
        }, error);
      });

      return;
    }

    // -----------------------------------------------------------------------
    // 405 for wrong method on known paths, 404 for everything else
    // -----------------------------------------------------------------------
    if (url === "/webhooks" && method !== "POST") {
      res.writeHead(405, { Allow: "POST" });
      res.end();
      return;
    }

    res.writeHead(404);
    res.end();
  });

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
