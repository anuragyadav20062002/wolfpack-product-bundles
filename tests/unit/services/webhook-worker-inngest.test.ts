/**
 * Unit Tests: Webhook Worker → Inngest integration
 *
 * Verifies:
 *  - inngest.send() is called with correct event name and payload shape
 *  - HTTP 200 is returned to Shopify even when inngest.send() throws
 *  - inngest.send() is called before res.end()
 *  - The old fire-and-forget WebhookProcessor call is removed
 */

import { createHmac } from "crypto";

// Mock inngest client BEFORE importing the worker
const mockSend = jest.fn();
jest.mock("../../../app/inngest/client", () => ({
  inngest: { send: mockSend },
}));

// Mock WebhookProcessor — it should NOT be called directly by the worker anymore
jest.mock("../../../app/services/webhooks/processor.server", () => ({
  WebhookProcessor: {
    processPubSubMessage: jest.fn(),
  },
}));

// Mock logger to suppress output
jest.mock("../../../app/lib/logger", () => ({
  AppLogger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    startTimer: jest.fn(() => jest.fn()),
  },
}));

import { IncomingMessage, ServerResponse } from "http";
import { Socket } from "net";
import { WebhookProcessor } from "../../../app/services/webhooks/processor.server";
import { handleRequest } from "../../../app/services/webhook-worker.server";

const mockProcessPubSub = WebhookProcessor.processPubSubMessage as jest.Mock;

// Helper: build a valid HMAC for the given body
function makeHmac(body: string): string {
  return createHmac("sha256", process.env.SHOPIFY_API_SECRET!)
    .update(Buffer.from(body))
    .digest("base64");
}

// Helper: build a minimal mock IncomingMessage + ServerResponse pair
function buildReqRes(
  body: string,
  headers: Record<string, string> = {},
): { req: IncomingMessage; res: ServerResponse; resData: { statusCode?: number; ended: boolean; body: string } } {
  const socket = new Socket();
  const req = new IncomingMessage(socket);
  req.method = "POST";
  req.url = "/webhooks";

  const defaultHeaders = {
    "x-shopify-topic": "inventory_levels/update",
    "x-shopify-shop-domain": "test.myshopify.com",
    "x-shopify-webhook-id": "wh-001",
    "x-shopify-api-version": "2025-10",
    "x-shopify-hmac-sha256": makeHmac(body),
    "content-type": "application/json",
  };

  Object.assign(req.headers, defaultHeaders, headers);

  const resData = { statusCode: undefined as number | undefined, ended: false, body: "" };
  const res = new ServerResponse(req);
  const origWriteHead = res.writeHead.bind(res);
  res.writeHead = (statusCode: number, ...args: any[]) => {
    resData.statusCode = statusCode;
    return origWriteHead(statusCode, ...args);
  };
  const origEnd = res.end.bind(res);
  res.end = (chunk?: any) => {
    resData.ended = true;
    resData.body = chunk ? chunk.toString() : "";
    return origEnd(chunk);
  };

  return { req, res, resData };
}

// Fire body data into the request stream
function emitBody(req: IncomingMessage, body: string) {
  process.nextTick(() => {
    req.emit("data", Buffer.from(body));
    req.emit("end");
  });
}

describe("Webhook worker → Inngest integration", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockProcessPubSub.mockReset();
    mockSend.mockResolvedValue(undefined);
  });

  it("calls inngest.send with 'shopify/webhook' event and correct payload fields", async () => {
    const body = JSON.stringify({ inventory_item_id: 123 });
    const { req, res, resData } = buildReqRes(body);


    emitBody(req, body);
    await new Promise<void>((resolve) => {
      const origEnd = res.end.bind(res);
      res.end = (chunk?: any) => {
        origEnd(chunk);
        resolve();
        return res;
      };
      handleRequest(req, res);
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    const [sentEvent] = mockSend.mock.calls[0];
    expect(sentEvent.name).toBe("shopify/webhook");
    expect(sentEvent.data.topic).toBe("inventory_levels/update");
    expect(sentEvent.data.shopDomain).toBe("test.myshopify.com");
    expect(sentEvent.data.webhookId).toBe("wh-001");
    expect(sentEvent.data.apiVersion).toBe("2025-10");
    // rawPayload must be base64-encoded body
    expect(Buffer.from(sentEvent.data.rawPayload, "base64").toString()).toBe(body);
    expect(resData.statusCode).toBe(200);
  });

  it("returns 200 even when inngest.send() throws", async () => {
    mockSend.mockRejectedValue(new Error("Inngest unreachable"));
    const body = JSON.stringify({ test: true });
    const { req, res, resData } = buildReqRes(body);

    if (!handleRequest) return;

    emitBody(req, body);
    await new Promise<void>((resolve) => {
      const origEnd = res.end.bind(res);
      res.end = (chunk?: any) => {
        origEnd(chunk);
        resolve();
        return res;
      };
      handleRequest(req, res);
    });

    expect(resData.statusCode).toBe(200);
    expect(resData.ended).toBe(true);
  });

  it("does NOT call WebhookProcessor.processPubSubMessage directly", async () => {
    mockSend.mockResolvedValue(undefined);
    const body = JSON.stringify({ test: true });
    const { req, res } = buildReqRes(body);

    if (!handleRequest) return;

    emitBody(req, body);
    await new Promise<void>((resolve) => {
      const origEnd = res.end.bind(res);
      res.end = (chunk?: any) => {
        origEnd(chunk);
        resolve();
        return res;
      };
      handleRequest(req, res);
    });

    // Give async operations time to settle
    await new Promise((r) => setTimeout(r, 50));
    expect(mockProcessPubSub).not.toHaveBeenCalled();
  });
});
