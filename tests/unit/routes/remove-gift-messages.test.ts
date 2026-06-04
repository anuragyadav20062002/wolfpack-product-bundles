import { readFileSync } from "node:fs";
import { join } from "node:path";

const readSource = (relativePath: string) =>
  readFileSync(join(process.cwd(), relativePath), "utf8");

describe("gift/message-product feature removal", () => {
  const fpbRoute = readSource("app/routes/app/app.bundles.full-page-bundle.configure.$bundleId/route.tsx");
  const ppbRoute = readSource("app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/route.tsx");
  const ppbParsers = readSource("app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/parsers.ts");
  const ppbHandlers = readSource("app/routes/app/app.bundles.product-page-bundle.configure.$bundleId/handlers/handlers.server.ts");
  const prismaSchema = readSource("prisma/schema.prisma");
  const fpbWidget = readSource("app/assets/bundle-widget-full-page.js");
  const ppbWidget = readSource("app/assets/bundle-widget-product-page.js");
  const fpbWidgetCss = readSource("app/assets/widgets/full-page-css/bundle-widget-full-page.css");
  const ppbWidgetCss = readSource("app/assets/widgets/product-page-css/bundle-widget.css");

  it("removes the FPB Messages Admin section and gift-message save serialization", () => {
    [
      'id: "messages"',
      'activeSetupSection === "messages"',
      "giftMessageDraft",
      "buildGiftMessageConfigFromDraft",
      "personalizationData.giftMessage",
      "Enable Messages",
      "Message will show up as a product at checkout",
      "Send message through email to the customer",
    ].forEach((marker) => {
      expect(fpbRoute).not.toContain(marker);
    });
  });

  it("removes PPB Messages Admin section, parser, handler, and schema fields", () => {
    [
      'activeSection === "messages"',
      "giftMessagesEnabled",
      "giftMessageProductId",
      "giftMessageProductTitle",
      "giftMessageEnableSenderRecipient",
      "giftMessageMandatory",
      "giftMessageEnableLimit",
      "giftMessageCharLimit",
      "giftMessageSendEmail",
    ].forEach((marker) => {
      expect(ppbRoute).not.toContain(marker);
      expect(ppbParsers).not.toContain(marker);
      expect(ppbHandlers).not.toContain(marker);
      expect(prismaSchema).not.toContain(marker);
    });
  });

  it("removes FPB storefront gift-message rendering, validation, and cart line code", () => {
    [
      "giftMessageState",
      "getGiftMessageConfig",
      "renderGiftMessageSection",
      "validateGiftMessageBeforeCart",
      "validateGiftMessageEmailBeforeCart",
      "buildGiftMessageCartItem",
      "gbbGiftMessageV2",
      "gbbEmailAddressHTML",
      "_gift_message",
      "Recipient Email",
    ].forEach((marker) => {
      expect(fpbWidget).not.toContain(marker);
    });
  });

  it("removes PPB storefront gift-message rendering, validation, and cart line code", () => {
    [
      "giftMessageState",
      "_createGiftMessageEl",
      "renderGiftMessage",
      "giftMessagesEnabled",
      "giftMessageProductId",
      "giftMessageMandatory",
      "bw-gift-message",
      "_gift_message",
      "Add a gift message to continue",
    ].forEach((marker) => {
      expect(ppbWidget).not.toContain(marker);
    });
  });

  it("removes gift-message widget CSS classes while leaving pricing messages untouched", () => {
    expect(fpbWidgetCss).not.toContain(".fpb-gift-message");
    expect(ppbWidgetCss).not.toContain(".bw-gift-message");

    expect(fpbWidget).toContain("updateMessagesFromBundle()");
    expect(ppbWidget).toContain("updateMessagesFromBundle()");
  });
});
