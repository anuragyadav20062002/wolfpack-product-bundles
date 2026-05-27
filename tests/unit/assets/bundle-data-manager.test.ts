import { BundleDataManager } from "../../../app/assets/widgets/shared/bundle-data-manager.js";

describe("BundleDataManager", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    Object.defineProperty(global, "window", {
      value: {
        Shopify: undefined,
        isThemeEditorContext: false,
        location: {
          pathname: "/apps/product-bundles/wpb/bundle-1",
          search: "",
        },
        autoDetectedBundleId: undefined,
      },
      writable: true,
    });

    Object.defineProperty(global, "document", {
      value: {
        referrer: "",
      },
      writable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(global, "window", {
      value: originalWindow,
      writable: true,
    });
  });

  it("selects a draft full-page bundle when it is requested explicitly by bundle ID", () => {
    const bundle = {
      id: "bundle-1",
      name: "Draft FPB",
      status: "draft",
      bundleType: "full_page",
      steps: [{ id: "step-1", name: "Step 1" }],
    };

    const selected = BundleDataManager.selectBundle(
      { "bundle-1": bundle },
      { bundleId: "bundle-1" },
    );

    expect(selected).toBe(bundle);
  });

  it("does not select a draft bundle without an explicit full-page bundle ID", () => {
    const bundle = {
      id: "bundle-1",
      name: "Draft FPB",
      status: "draft",
      bundleType: "full_page",
      steps: [{ id: "step-1", name: "Step 1" }],
    };

    const selected = BundleDataManager.selectBundle(
      { "bundle-1": bundle },
      { bundleId: null },
    );

    expect(selected).toBeNull();
  });
});
