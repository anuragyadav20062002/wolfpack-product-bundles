import {
  createFpbPreviewToken,
  FPB_PREVIEW_TOKEN_TTL_MS,
  verifyFpbPreviewToken,
} from "../../../app/lib/fpb-preview-token.server";

describe("FPB preview token", () => {
  const input = {
    shop: "test-shop.myshopify.com",
    bundleId: "bundle-1",
    apiSecret: "test-secret",
    now: 1_000,
  };

  it("accepts a valid shop and bundle-bound token", () => {
    const token = createFpbPreviewToken(input);
    expect(verifyFpbPreviewToken({ ...input, token })).toBe(true);
  });

  it("rejects tampering, expiry, and mismatched bindings", () => {
    const token = createFpbPreviewToken(input);
    expect(verifyFpbPreviewToken({ ...input, token: `${token}x` })).toBe(false);
    expect(verifyFpbPreviewToken({ ...input, token, now: input.now + FPB_PREVIEW_TOKEN_TTL_MS })).toBe(false);
    expect(verifyFpbPreviewToken({ ...input, token, shop: "other.myshopify.com" })).toBe(false);
    expect(verifyFpbPreviewToken({ ...input, token, bundleId: "bundle-2" })).toBe(false);
  });
});
