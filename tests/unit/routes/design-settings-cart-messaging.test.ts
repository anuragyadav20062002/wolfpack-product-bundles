import { prisma } from "../../../app/db.server";
import fs from "node:fs";
import path from "node:path";
import { handleSaveSettings } from "../../../app/routes/app/app.design-control-panel/handlers.server";
import { DEFAULT_SETTINGS, mergeSettings } from "../../../app/components/design-control-panel/config";
import { CartTransformService } from "../../../app/services/cart-transform-service.server";

jest.mock("../../../app/db.server", () => ({
  __esModule: true,
  prisma: {
    designSettings: {
      upsert: jest.fn(),
    },
  },
  default: {
    designSettings: {
      upsert: jest.fn(),
    },
  },
}));

jest.mock("../../../app/services/cart-transform-service.server", () => ({
  CartTransformService: {
    syncCartLineMessagingSettings: jest.fn(),
  },
}));

const DEFAULT_CART_LINE_MESSAGING = {
  isEnabled: true,
  showBundleContains: true,
  showOriginalPrice: true,
  discountDisplay: {
    isEnabled: true,
    format: "amount_percentage",
  },
};

describe("DesignSettings cart-line messaging contract", () => {
  const mockDesignSettingsUpsert = prisma.designSettings.upsert as jest.Mock;
  const mockSyncCartLineMessagingSettings = CartTransformService.syncCartLineMessagingSettings as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDesignSettingsUpsert.mockResolvedValue({});
    mockSyncCartLineMessagingSettings.mockResolvedValue({ success: true });
  });

  it("has product-page defaults for cart-line messaging controls", () => {
    expect(DEFAULT_SETTINGS.product_page.bundleCartLineMessaging).toEqual(DEFAULT_CART_LINE_MESSAGING);
  });

  it("persists cart-line messaging as a direct DesignSettings field", async () => {
    const bundleCartLineMessaging = {
      isEnabled: true,
      showBundleContains: false,
      showOriginalPrice: true,
      discountDisplay: {
        isEnabled: true,
        format: "amount_percentage",
      },
    };

    await handleSaveSettings("shop.myshopify.com", {
      bundleType: "product_page",
      settings: {
        customCss: "",
        bundleCartLineMessaging,
      },
    });

    const upsertArg = mockDesignSettingsUpsert.mock.calls[0][0];
    expect(upsertArg.create.bundleCartLineMessaging).toEqual(bundleCartLineMessaging);
    expect(upsertArg.update.bundleCartLineMessaging).toEqual(bundleCartLineMessaging);
    expect(upsertArg.create.generalSettings).not.toHaveProperty("bundleCartLineMessaging");
    expect(upsertArg.update.generalSettings).not.toHaveProperty("bundleCartLineMessaging");
  });

  it("syncs product-page cart-line messaging to the cart transform owner", async () => {
    const admin = { graphql: jest.fn() };
    const bundleCartLineMessaging = {
      isEnabled: true,
      showBundleContains: false,
      showOriginalPrice: false,
      discountDisplay: {
        isEnabled: false,
        format: "amount_percentage",
      },
    };

    await handleSaveSettings("shop.myshopify.com", {
      bundleType: "product_page",
      settings: {
        customCss: "",
        bundleCartLineMessaging,
      },
    }, admin as any);

    expect(mockSyncCartLineMessagingSettings).toHaveBeenCalledWith(
      admin,
      "shop.myshopify.com",
      bundleCartLineMessaging
    );
  });

  it("merges saved cart-line messaging into loaded DCP settings", () => {
    const saved = {
      isEnabled: true,
      showBundleContains: true,
      showOriginalPrice: false,
      discountDisplay: {
        isEnabled: false,
        format: "amount_percentage",
      },
    };

    const merged = mergeSettings(
      { bundleCartLineMessaging: saved },
      DEFAULT_SETTINGS.product_page
    );

    expect(merged.bundleCartLineMessaging).toEqual(saved);
  });

  it("uses React-handled switch buttons so Additional Configurations opens the save footer", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/components/design-control-panel/settings/CartLineMessagingSettings.tsx"),
      "utf8"
    );

    expect(source).toContain('type="button"');
    expect(source).toContain('role="switch"');
    expect(source).toContain('aria-checked={checked}');
    expect(source).not.toContain('type="checkbox"');
  });

  it("does not load the preview barrel on the Cart Messaging deep-link route", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "app/routes/app/app.design-control-panel/route.tsx"),
      "utf8"
    );

    expect(source).toContain('from "../../../components/design-control-panel/preview/PreviewPanel"');
    expect(source).not.toContain('from "../../../components/design-control-panel/preview"');
  });
});
