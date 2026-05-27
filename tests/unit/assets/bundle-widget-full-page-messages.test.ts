import fs from "node:fs";
import path from "node:path";

const widgetSource = () =>
  fs.readFileSync(
    path.join(process.cwd(), "app/assets/bundle-widget-full-page.js"),
    "utf8",
  );

describe("Full Page widget message personalization contract", () => {
  it("reads the direct gift-message personalization object", () => {
    const source = widgetSource();

    expect(source).toContain("getGiftMessageConfig()");
    expect(source).toContain("this.selectedBundle?.personalizationData?.giftMessage");
    expect(source).toContain("giftMessage.isGiftMessageEnabled === true");
  });

  it("renders the captured non-email message fields and character limit", () => {
    const source = widgetSource();

    expect(source).toContain("gbbGiftMessageV2FromField");
    expect(source).toContain("gbbGiftMessageV2ToField");
    expect(source).toContain("gbbGiftMessageV2InputField");
    expect(source).toContain("Enter a message here...");
    expect(source).toContain("textarea.maxLength = Number(giftMessage.giftMessageCharacterLimit);");
    expect(source).not.toContain("gbbVideoMsgEmailField");
  });

  it("blocks cart add with the captured required-message validation text", () => {
    const source = widgetSource();

    expect(source).toContain("validateGiftMessageBeforeCart()");
    expect(source).toContain("Please enter a message");
    expect(source).toContain("this.setGiftMessageValidationError(true)");
  });

  it("adds the message product line when a message is entered", () => {
    const source = widgetSource();
    const messageCartBlock = source.match(/buildGiftMessageCartItem[\s\S]*?return \{\n      id: numericVariantId,/);

    expect(source).toContain("buildGiftMessageCartItem(bundleInstanceId, bundleName)");
    expect(source).toContain("'_gift_message': message");
    expect(source).toContain("'_gift_from'");
    expect(source).toContain("'_gift_to'");
    expect(source).toContain("items.push(giftMessageItem);");
    expect(messageCartBlock?.[0]).not.toContain("'_bundle_id'");
  });
});
