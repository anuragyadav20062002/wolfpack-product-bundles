/**
 * Unit tests — parsePPBGiftMessages
 *
 * Spec: test-spec/ppb-gift-messages.spec.md
 * Issue: [ppb-edit-bundle-flow-1]
 */

import { parsePPBGiftMessages } from "../../../app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/parsers";

function makeForm(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.append(key, value);
  }
  return fd;
}

describe("parsePPBGiftMessages", () => {
  it("returns all defaults when form has no gift message fields", () => {
    const result = parsePPBGiftMessages(makeForm({}));
    expect(result.giftMessagesEnabled).toBe(false);
    expect(result.giftMessageProductId).toBeNull();
    expect(result.giftMessageProductTitle).toBeNull();
    expect(result.giftMessageEnableSenderRecipient).toBe(false);
    expect(result.giftMessageMandatory).toBe(false);
    expect(result.giftMessageEnableLimit).toBe(false);
    expect(result.giftMessageCharLimit).toBeNull();
    expect(result.giftMessageSendEmail).toBe(false);
  });

  it("parses giftMessagesEnabled=true correctly", () => {
    const result = parsePPBGiftMessages(makeForm({ giftMessagesEnabled: "true" }));
    expect(result.giftMessagesEnabled).toBe(true);
  });

  it("parses all boolean fields correctly", () => {
    const result = parsePPBGiftMessages(makeForm({
      giftMessagesEnabled: "true",
      giftMessageEnableSenderRecipient: "true",
      giftMessageMandatory: "true",
      giftMessageEnableLimit: "true",
      giftMessageSendEmail: "true",
    }));
    expect(result.giftMessageEnableSenderRecipient).toBe(true);
    expect(result.giftMessageMandatory).toBe(true);
    expect(result.giftMessageEnableLimit).toBe(true);
    expect(result.giftMessageSendEmail).toBe(true);
  });

  it("parses giftMessageProductId and title when provided", () => {
    const result = parsePPBGiftMessages(makeForm({
      giftMessageProductId: "gid://shopify/Product/123",
      giftMessageProductTitle: "Gift Card",
    }));
    expect(result.giftMessageProductId).toBe("gid://shopify/Product/123");
    expect(result.giftMessageProductTitle).toBe("Gift Card");
  });

  it("returns null for productId when field is empty string", () => {
    const result = parsePPBGiftMessages(makeForm({ giftMessageProductId: "" }));
    expect(result.giftMessageProductId).toBeNull();
  });

  it("parses giftMessageCharLimit as integer when enableLimit is true", () => {
    const result = parsePPBGiftMessages(makeForm({
      giftMessageEnableLimit: "true",
      giftMessageCharLimit: "300",
    }));
    expect(result.giftMessageCharLimit).toBe(300);
  });

  it("sets giftMessageCharLimit to null when enableLimit is false", () => {
    const result = parsePPBGiftMessages(makeForm({
      giftMessageEnableLimit: "false",
      giftMessageCharLimit: "300",
    }));
    expect(result.giftMessageCharLimit).toBeNull();
  });

  it("ignores non-numeric charLimit gracefully", () => {
    const result = parsePPBGiftMessages(makeForm({
      giftMessageEnableLimit: "true",
      giftMessageCharLimit: "abc",
    }));
    expect(result.giftMessageCharLimit).toBeNull();
  });
});
