import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INDIVIDUAL_SELLING_PLAN_BLOCKED_MESSAGE,
  PRODUCT_PAGE_EDIT_DEFAULTS_HREF,
  PRODUCT_PAGE_SETUP_ITEMS,
  SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE,
  buildProductPageThemeEditorDeepLink,
  deriveCommonSellingPlanGroups,
  extractSellingPlanValidationSources,
  resolveProductPageTemplateSuffix,
  resolveProductPageThemeEditorTemplateHandle,
} from "../../../app/lib/bundle-config/product-page-admin-sections";

const configureHandlersSource = readFileSync(
  join(process.cwd(), "app/services/bundles/bundle-configure-handlers.server.ts"),
  "utf8"
);
const getThemeTemplatesSource = configureHandlersSource.slice(
  configureHandlersSource.indexOf("export async function handleGetThemeTemplates"),
  configureHandlersSource.indexOf("/**\n * Handle getting current theme for deep linking")
);

describe("product page admin sections", () => {
  it("matches the captured product-page setup rail order", () => {
    expect(PRODUCT_PAGE_SETUP_ITEMS.map((item) => item.id)).toEqual([
      "step_setup",
      "discount_pricing",
      "bundle_visibility",
      "bundle_settings",
      "subscriptions",
      "select_template",
    ]);
  });

  it("routes Bundle Settings Edit Defaults to Settings", () => {
    expect(PRODUCT_PAGE_EDIT_DEFAULTS_HREF).toBe("/app/settings");
  });

  it("uses the captured no-common-selling-plan validation message", () => {
    expect(SUBSCRIPTION_NO_COMMON_PLAN_MESSAGE).toBe(
      "To offer this bundle as a subscription, all of its products must be part of the same subscription plan in your Shopify settings. Please update your product selling plans and try again."
    );
  });

  it("uses the captured individual selling plan blocked-state message", () => {
    expect(INDIVIDUAL_SELLING_PLAN_BLOCKED_MESSAGE).toBe(
      "Individual selling plans can't be enabled while a bundle-level subscription or BXGY discount is active. Disable it to use individual selling plans."
    );
  });

  it("extracts direct, category, default, and collection sources for subscription validation", () => {
    const sources = extractSellingPlanValidationSources({
      defaultProductsData: {
        products: [
          { graphqlId: "gid://shopify/Product/101" },
          { productId: "102" },
        ],
      },
      steps: [
        {
          products: [{ id: "gid://shopify/Product/201" }],
          collections: [{ id: "gid://shopify/Collection/301" }],
          StepProduct: [
            { productId: "202" },
            { productId: "gid://shopify/Product/203" },
          ],
          StepCategory: [
            {
              products: [{ id: "gid://shopify/Product/204" }],
              collections: [{ id: "302" }],
            },
          ],
        },
      ],
    });

    expect(sources.productIds).toEqual([
      "gid://shopify/Product/101",
      "gid://shopify/Product/102",
      "gid://shopify/Product/201",
      "gid://shopify/Product/202",
      "gid://shopify/Product/203",
      "gid://shopify/Product/204",
    ]);
    expect(sources.collectionIds).toEqual([
      "gid://shopify/Collection/301",
      "gid://shopify/Collection/302",
    ]);
  });

  it("returns only selling plan groups shared by every selected product", () => {
    const common = deriveCommonSellingPlanGroups([
      {
        id: "gid://shopify/Product/1",
        title: "One",
        sellingPlanGroups: {
          nodes: [
            { id: "gid://shopify/SellingPlanGroup/a", name: "Monthly" },
            { id: "gid://shopify/SellingPlanGroup/b", name: "Weekly" },
          ],
        },
      },
      {
        id: "gid://shopify/Product/2",
        title: "Two",
        sellingPlanGroups: {
          nodes: [
            { id: "gid://shopify/SellingPlanGroup/a", name: "Monthly" },
            { id: "gid://shopify/SellingPlanGroup/c", name: "Yearly" },
          ],
        },
      },
    ] as any);

    expect(common).toEqual([
      { id: "gid://shopify/SellingPlanGroup/a", name: "Monthly" },
    ]);
  });

  it("keeps merchant-selected template handles unchanged even for legacy bundle-container rows", () => {
    expect(
      resolveProductPageThemeEditorTemplateHandle({
        handle: "product.codex-ppb-2026-05-21",
        fullKey: "theme-app-extension",
        isBundleContainer: true,
      })
    ).toBe("product.codex-ppb-2026-05-21");
  });

  it("keeps real product-specific templates when Shopify theme assets prove they exist", () => {
    expect(
      resolveProductPageThemeEditorTemplateHandle({
        handle: "product.custom-bundle",
        fullKey: "templates/product.custom-bundle.json",
        isBundleContainer: true,
      })
    ).toBe("product.custom-bundle");
  });

  it("builds the Theme Editor deep link against the merchant-selected template handle", () => {
    expect(
      buildProductPageThemeEditorDeepLink({
        shop: "agent-5sfidg3m.myshopify.com",
        apiKey: "app-key",
        blockHandle: "bundle-product-page",
        bundleId: "bundle-123",
        productHandle: "codex-ppb-2026-05-21",
        template: {
          handle: "product.codex-ppb-2026-05-21",
          fullKey: "theme-app-extension",
          isBundleContainer: true,
        },
      })
    ).toBe(
      "https://agent-5sfidg3m.myshopify.com/admin/themes/current/editor?template=product.codex-ppb-2026-05-21&addAppBlockId=app-key/bundle-product-page&target=newAppsSection&bundleId=bundle-123&previewPath=%2Fproducts%2Fcodex-ppb-2026-05-21"
    );
  });

  it("uses the merchant-selected product template handle in the Theme Editor deep link", () => {
    expect(
      buildProductPageThemeEditorDeepLink({
        shop: "agent-5sfidg3m.myshopify.com",
        apiKey: "app-key",
        blockHandle: "bundle-product-page",
        bundleId: "bundle-123",
        productHandle: "codex-ppb-2026-05-21",
        template: {
          handle: "product.custom-merch-template",
          fullKey: "templates/product.custom-merch-template.json",
        },
      })
    ).toBe(
      "https://agent-5sfidg3m.myshopify.com/admin/themes/current/editor?template=product.custom-merch-template&addAppBlockId=app-key/bundle-product-page&target=newAppsSection&bundleId=bundle-123&previewPath=%2Fproducts%2Fcodex-ppb-2026-05-21"
    );
  });

  it("uses Shopify's product preview path when the parent product is draft", () => {
    expect(
      buildProductPageThemeEditorDeepLink({
        shop: "agent-5sfidg3m.myshopify.com",
        apiKey: "app-key",
        blockHandle: "bundle-product-page",
        bundleId: "bundle-123",
        productHandle: "codex-ppb-2026-05-21",
        productPreviewUrl: "https://abc123.shopifypreview.com/products_preview?preview_key=secret",
        template: {
          handle: "product.custom-merch-template",
          fullKey: "templates/product.custom-merch-template.json",
        },
      })
    ).toBe(
      "https://agent-5sfidg3m.myshopify.com/admin/themes/current/editor?template=product.custom-merch-template&addAppBlockId=app-key/bundle-product-page&target=newAppsSection&bundleId=bundle-123&previewPath=%2Fproducts_preview%3Fpreview_key%3Dsecret"
    );
  });

  it("resolves Shopify product template suffixes from selected product template handles", () => {
    expect(resolveProductPageTemplateSuffix({ handle: "product" })).toBeNull();
    expect(resolveProductPageTemplateSuffix({ handle: "product.custom-merch-template" })).toBe("custom-merch-template");
  });

  it("lists only merchant theme product templates without generated fallback rows", () => {
    expect(getThemeTemplatesSource).toContain('return template.handle === "product" || template.handle.startsWith("product.")');
    expect(getThemeTemplatesSource).not.toContain("ensureProductTemplate(product.handle)");
    expect(getThemeTemplatesSource).not.toMatch(/bundle-product-\$\{product\.handle\}/);
    expect(getThemeTemplatesSource).not.toContain("All Product Pages (General)");
  });

  it("lists theme asset template names without hardcoded display-name rewriting", () => {
    expect(getThemeTemplatesSource).toContain("title: templateName");
    expect(getThemeTemplatesSource).not.toContain("formatProductTemplateTitle");
    expect(getThemeTemplatesSource).not.toContain('return "Default product"');
    expect(getThemeTemplatesSource).not.toContain(".replace(/^product\\./, \"\")");
  });
});
