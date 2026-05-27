import { hasDesignSettingChanged } from "../../../app/hooks/useDesignControlPanelState";
import type { BundleCartLineMessagingSettings } from "../../../app/types/state.types";

describe("Design Control Panel dirty-state comparison", () => {
  it("treats deep-equal cart-line messaging as clean", () => {
    const original: BundleCartLineMessagingSettings = {
      isEnabled: true,
      showBundleContains: true,
      showOriginalPrice: true,
      discountDisplay: {
        isEnabled: true,
        format: "amount_percentage",
      },
    };

    const current: BundleCartLineMessagingSettings = {
      ...original,
      discountDisplay: {
        ...original.discountDisplay,
      },
    };

    expect(hasDesignSettingChanged("bundleCartLineMessaging", current, original)).toBe(false);
  });

  it("detects nested cart-line messaging toggle changes", () => {
    const original: BundleCartLineMessagingSettings = {
      isEnabled: true,
      showBundleContains: true,
      showOriginalPrice: true,
      discountDisplay: {
        isEnabled: true,
        format: "amount_percentage",
      },
    };

    expect(hasDesignSettingChanged("bundleCartLineMessaging", {
      ...original,
      showBundleContains: false,
    }, original)).toBe(true);

    expect(hasDesignSettingChanged("bundleCartLineMessaging", {
      ...original,
      discountDisplay: {
        ...original.discountDisplay,
        isEnabled: false,
      },
    }, original)).toBe(true);
  });

  it("keeps existing string normalization rules for product cards per row and custom CSS", () => {
    expect(hasDesignSettingChanged("productCardsPerRow", "4", 4)).toBe(false);
    expect(hasDesignSettingChanged("customCss", "", null)).toBe(false);
    expect(hasDesignSettingChanged("customCss", ".bundle{}", "")).toBe(true);
  });
});
