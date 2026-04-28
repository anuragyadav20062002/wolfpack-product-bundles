import { formatBundleForWidget } from "../../../app/lib/bundle-formatter.server";

// Minimal DB bundle fixture
const makeBundle = (overrides: Record<string, unknown> = {}) => ({
  id: "bundle-1",
  name: "Test Bundle",
  description: "A test bundle",
  status: "ACTIVE",
  bundleType: "full_page",
  fullPageLayout: "FOOTER_BOTTOM",
  shopifyProductId: "gid://shopify/Product/123",
  promoBannerBgImage: null,
  promoBannerBgImageCrop: null,
  loadingGif: null,
  tierConfig: null,
  showStepTimeline: null,
  steps: [],
  pricing: null,
  ...overrides,
});

const makeStep = (overrides: Record<string, unknown> = {}) => ({
  id: "step-1",
  name: "Pick a product",
  position: 1,
  minQuantity: 1,
  maxQuantity: 1,
  enabled: true,
  displayVariantsAsIndividual: false,
  collections: [],
  conditionType: null,
  conditionOperator: null,
  conditionValue: null,
  conditionOperator2: null,
  conditionValue2: null,
  isFreeGift: false,
  freeGiftName: null,
  isDefault: false,
  defaultVariantId: null,
  StepProduct: [],
  ...overrides,
});

const makeStepProduct = (overrides: Record<string, unknown> = {}) => ({
  productId: "gid://shopify/Product/999",
  title: "My Product",
  imageUrl: "https://cdn.shopify.com/img.jpg",
  minQuantity: null,
  maxQuantity: null,
  position: 0,
  variants: [],
  ...overrides,
});

describe("formatBundleForWidget", () => {
  it("returns top-level bundle fields", () => {
    const result = formatBundleForWidget(makeBundle() as any);
    expect(result.id).toBe("bundle-1");
    expect(result.name).toBe("Test Bundle");
    expect(result.bundleType).toBe("full_page");
    expect(result.status).toBe("ACTIVE");
    expect(result.pricing).toBeNull();
    expect(result.steps).toHaveLength(0);
  });

  it("nullifies optional fields when absent", () => {
    const bundle = makeBundle({ fullPageLayout: undefined });
    const result = formatBundleForWidget(bundle as any);
    expect(result.fullPageLayout).toBeNull();
  });

  it("converts variant price strings to integer cents", () => {
    const step = makeStep({
      StepProduct: [
        makeStepProduct({
          variants: [{ id: "gid://shopify/ProductVariant/42", price: "19.99", title: "S" }],
        }),
      ],
    });
    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);
    const product = result.steps[0].products[0];
    expect(product.price).toBe(1999);
    expect(product.variants[0].price).toBe(1999);
  });

  it("extracts numeric ID from Shopify GID for variant id", () => {
    const step = makeStep({
      StepProduct: [
        makeStepProduct({
          variants: [{ id: "gid://shopify/ProductVariant/789", price: "10.00", title: "M" }],
        }),
      ],
    });
    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);
    expect(result.steps[0].products[0].variants[0].id).toBe("789");
    expect(result.steps[0].products[0].variants[0].gid).toBe("gid://shopify/ProductVariant/789");
  });

  it("handles null compareAtPrice", () => {
    const step = makeStep({
      StepProduct: [
        makeStepProduct({
          variants: [{ id: "gid://shopify/ProductVariant/1", price: "5.00", compareAtPrice: null, title: "L" }],
        }),
      ],
    });
    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);
    expect(result.steps[0].products[0].compareAtPrice).toBeNull();
    expect(result.steps[0].products[0].variants[0].compareAtPrice).toBeNull();
  });

  it("handles step with no products", () => {
    const result = formatBundleForWidget(makeBundle({ steps: [makeStep()] }) as any);
    expect(result.steps[0].products).toHaveLength(0);
  });

  it("includes pricing when present", () => {
    const pricing = {
      enabled: true,
      method: "percentage_off",
      rules: [{ quantity: 2, discountValue: 10 }],
      showFooter: true,
      messages: { progress: "Add {n} more" },
    };
    const result = formatBundleForWidget(makeBundle({ pricing }) as any);
    expect(result.pricing).not.toBeNull();
    expect(result.pricing!.method).toBe("percentage_off");
    expect(result.pricing!.rules).toHaveLength(1);
  });

  it("uses empty array for missing step collections", () => {
    const step = makeStep({ collections: undefined });
    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);
    expect(result.steps[0].collections).toEqual([]);
  });

  it("sets featuredImage from imageUrl when present", () => {
    const step = makeStep({
      StepProduct: [makeStepProduct({ imageUrl: "https://cdn.shopify.com/test.jpg" })],
    });
    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);
    const p = result.steps[0].products[0];
    expect(p.featuredImage).toEqual({ url: "https://cdn.shopify.com/test.jpg" });
  });

  it("sets featuredImage to null when imageUrl is absent", () => {
    const step = makeStep({
      StepProduct: [makeStepProduct({ imageUrl: null })],
    });
    const result = formatBundleForWidget(makeBundle({ steps: [step] }) as any);
    const p = result.steps[0].products[0];
    expect(p.featuredImage).toBeNull();
  });
});
