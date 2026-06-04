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

  it("renders the captured message fields and character limit", () => {
    const source = widgetSource();

    expect(source).toContain("gbbGiftMessageV2FromField");
    expect(source).toContain("gbbGiftMessageV2ToField");
    expect(source).toContain("gbbGiftMessageV2InputField");
    expect(source).toContain("Enter a message here...");
    expect(source).toContain("textarea.maxLength = Number(giftMessage.giftMessageCharacterLimit);");
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

  it("renders EB email capture fields when message email is enabled", () => {
    const source = widgetSource();

    expect(source).toContain("giftMessage.isEmailEnabled === true");
    expect(source).toContain("gbbEmailAddressHTML");
    expect(source).toContain("gbbEmailAddressWrapper");
    expect(source).toContain("gbbVideoMsgEmailField");
    expect(source).toContain("gbbEmailAddressLabelField");
    expect(source).toContain("giftMessageDeliveryInfo");
    expect(source).toContain("gbbScheduleMessageDeliveryHTML");
    expect(source).toContain("gbbScheduleMessageSendNowContainer");
    expect(source).toContain("gbbScheduleMessageSendLaterContainer");
    expect(source).toContain("gbbScheduleMessageDatePicker");
    expect(source).toContain("gbbEmailValidationError");
    expect(source).toContain("Enter a recipient email address here...");
  });

  it("validates required recipient email before cart add when email capture is enabled", () => {
    const source = widgetSource();

    expect(source).toContain("validateGiftMessageEmailBeforeCart()");
    expect(source).toContain("Please enter a valid email address");
    expect(source).toContain("this.setGiftMessageEmailValidationError(true)");
    expect(source).toContain("gbbEmailValidationError");
  });

  it("adds captured recipient email and delivery options to the message cart line", () => {
    const source = widgetSource();

    expect(source).toContain("Message");
    expect(source).toContain("Recipient Name");
    expect(source).toContain("Sender Name");
    expect(source).toContain("Recipient Email");
    expect(source).toContain("_gbbEmailDeliveryDate");
    expect(source).toContain("_gbbEmailDeliveryOption");
  });

});
