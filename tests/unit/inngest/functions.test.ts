/**
 * Unit Tests: Inngest shopify-webhook function
 *
 * Verifies:
 *  - Processor is called with the correct reconstructed PubSubMessage
 *  - Function throws when processor returns success: false (triggers Inngest retry)
 *  - Function completes without throw when processor returns success: true
 */

jest.mock("../../../app/services/webhooks/processor.server", () => ({
  WebhookProcessor: {
    processPubSubMessage: jest.fn(),
  },
}));

// Mock the inngest client so createFunction captures the handler synchronously
jest.mock("../../../app/inngest/client", () => ({
  inngest: {
    createFunction: jest.fn(
      (config: any, _trigger: any, handler: any) =>
        ({ __config: config, __trigger: _trigger, __handler: handler }),
    ),
  },
}));

import { WebhookProcessor } from "../../../app/services/webhooks/processor.server";
import { webhookFunction } from "../../../app/inngest/functions";

const mockProcess = WebhookProcessor.processPubSubMessage as jest.Mock;
const fn = webhookFunction as any;

const sampleData = {
  rawPayload: Buffer.from(JSON.stringify({ inventory_item_id: 123 })).toString("base64"),
  topic: "inventory_levels/update",
  shopDomain: "test.myshopify.com",
  webhookId: "abc-123",
  apiVersion: "2025-10",
};

describe("shopify-webhook Inngest function", () => {
  beforeEach(() => {
    mockProcess.mockReset();
  });

  it("registers with id 'shopify-webhook', retries: 3, event 'shopify/webhook'", () => {
    expect(fn.__config.id).toBe("shopify-webhook");
    expect(fn.__config.retries).toBe(3);
    expect(fn.__trigger.event).toBe("shopify/webhook");
  });

  it("calls WebhookProcessor with a correctly reconstructed PubSubMessage", async () => {
    mockProcess.mockResolvedValue({ success: true, message: "ok" });

    await fn.__handler({ event: { data: sampleData } });

    expect(mockProcess).toHaveBeenCalledTimes(1);
    const [msg] = mockProcess.mock.calls[0];
    expect(msg.data).toBe(sampleData.rawPayload);
    expect(msg.attributes["X-Shopify-Topic"]).toBe("inventory_levels/update");
    expect(msg.attributes["X-Shopify-Shop-Domain"]).toBe("test.myshopify.com");
    expect(msg.attributes["X-Shopify-Webhook-Id"]).toBe("abc-123");
    expect(msg.attributes["X-Shopify-API-Version"]).toBe("2025-10");
  });

  it("resolves without throwing when processor returns success: true", async () => {
    mockProcess.mockResolvedValue({ success: true, message: "processed" });
    await expect(fn.__handler({ event: { data: sampleData } })).resolves.toMatchObject({
      processed: true,
    });
  });

  it("throws when processor returns success: false so Inngest retries", async () => {
    mockProcess.mockResolvedValue({ success: false, error: "DB timeout", message: "failed" });
    await expect(fn.__handler({ event: { data: sampleData } })).rejects.toThrow("DB timeout");
  });

  it("re-throws processor exceptions so Inngest retries", async () => {
    mockProcess.mockRejectedValue(new Error("Unexpected crash"));
    await expect(fn.__handler({ event: { data: sampleData } })).rejects.toThrow("Unexpected crash");
  });

  it("omits optional attributes when webhookId and apiVersion are absent", async () => {
    mockProcess.mockResolvedValue({ success: true, message: "ok" });
    const minimal = {
      rawPayload: Buffer.from("{}").toString("base64"),
      topic: "orders/create",
      shopDomain: "test.myshopify.com",
    };
    await fn.__handler({ event: { data: minimal } });
    const [msg] = mockProcess.mock.calls[0];
    expect(msg.attributes["X-Shopify-Webhook-Id"]).toBeUndefined();
    expect(msg.attributes["X-Shopify-API-Version"]).toBeUndefined();
  });
});
