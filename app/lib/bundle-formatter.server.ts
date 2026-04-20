/**
 * Shared bundle formatter for widget consumption.
 *
 * Used by:
 *  - app/routes/api/api.bundle.$bundleId[.]json.tsx  (proxy API response)
 *  - app/services/widget-installation/widget-full-page-bundle.server.ts (page metafield cache)
 *
 * Converts a Prisma bundle (with steps + StepProduct + pricing) into the
 * JSON shape the widget expects.
 */

/** Convert a Shopify GID to its numeric ID for storefront cart operations. */
function extractNumericId(gid: string): string {
  const match = gid.match(/\/(\d+)$/);
  return match ? match[1] : gid;
}

export interface FormattedBundle {
  id: string;
  name: string;
  description: string | null;
  status: string;
  bundleType: string;
  fullPageLayout: string | null;
  shopifyProductId: string | null;
  promoBannerBgImage: string | null;
  promoBannerBgImageCrop: string | null;
  loadingGif: string | null;
  tierConfig: unknown;
  showStepTimeline: boolean | null;
  steps: FormattedStep[];
  pricing: FormattedPricing | null;
}

interface FormattedStep {
  id: string;
  name: string;
  position: number;
  minQuantity: number | null;
  maxQuantity: number | null;
  enabled: boolean;
  displayVariantsAsIndividual: boolean;
  products: FormattedProduct[];
  collections: unknown[];
  StepProduct: unknown[];
  conditionType: string | null;
  conditionOperator: string | null;
  conditionValue: string | null;
  conditionOperator2: string | null;
  conditionValue2: string | null;
  isFreeGift: boolean;
  freeGiftName: string | null;
  isDefault: boolean;
  defaultVariantId: string | null;
  timelineIconUrl: string | null;
  primaryVariantOption: string | null;
}

interface FormattedProduct {
  id: string;
  title: string;
  handle: string;
  images: { url: string }[];
  featuredImage: { url: string } | null;
  price: number;
  compareAtPrice: number | null;
  available: boolean;
  variants: FormattedVariant[];
}

interface FormattedVariant {
  id: string;
  gid: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  image: { url: string } | null;
  available: boolean;
}

interface FormattedPricing {
  enabled: boolean;
  method: string | null;
  rules: unknown[];
  showFooter: boolean;
  messages: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatBundleForWidget(bundle: any): FormattedBundle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const steps = (bundle.steps ?? []).map((step: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stepProducts = (step.StepProduct ?? []) as any[];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productsArray: FormattedProduct[] = stepProducts.map((sp: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbVariants = (sp.variants as any[]) ?? [];
      const firstVariant = dbVariants[0];

      return {
        id: sp.productId,
        title: sp.title,
        handle: '',
        images: sp.imageUrl ? [{ url: sp.imageUrl }] : [],
        featuredImage: sp.imageUrl ? { url: sp.imageUrl } : null,
        price: firstVariant?.price ? Math.round(parseFloat(firstVariant.price) * 100) : 0,
        compareAtPrice: firstVariant?.compareAtPrice
          ? Math.round(parseFloat(firstVariant.compareAtPrice) * 100)
          : null,
        available: true,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        variants: dbVariants.map((v: any): FormattedVariant => ({
          id: extractNumericId(v.id ?? ''),
          gid: v.id ?? '',
          title: v.title ?? 'Default Title',
          price: Math.round(parseFloat(v.price ?? '0') * 100),
          compareAtPrice: v.compareAtPrice
            ? Math.round(parseFloat(v.compareAtPrice) * 100)
            : null,
          image: v.imageUrl ? { url: v.imageUrl } : (v.image ?? null),
          available: true,
        })),
      };
    });

    return {
      id: step.id,
      name: step.name,
      position: step.position,
      minQuantity: step.minQuantity,
      maxQuantity: step.maxQuantity,
      enabled: step.enabled,
      displayVariantsAsIndividual: step.displayVariantsAsIndividual,
      products: productsArray,
      collections: step.collections ?? [],
      StepProduct: stepProducts,
      conditionType: step.conditionType,
      conditionOperator: step.conditionOperator,
      conditionValue: step.conditionValue,
      conditionOperator2: step.conditionOperator2,
      conditionValue2: step.conditionValue2,
      isFreeGift: step.isFreeGift ?? false,
      freeGiftName: step.freeGiftName ?? null,
      isDefault: step.isDefault ?? false,
      defaultVariantId: step.defaultVariantId ?? null,
      timelineIconUrl: step.timelineIconUrl ?? null,
      primaryVariantOption: step.primaryVariantOption ?? null,
    };
  });

  return {
    id: bundle.id,
    name: bundle.name,
    description: bundle.description,
    status: bundle.status,
    bundleType: bundle.bundleType,
    fullPageLayout: bundle.fullPageLayout ?? null,
    shopifyProductId: bundle.shopifyProductId,
    promoBannerBgImage: bundle.promoBannerBgImage ?? null,
    promoBannerBgImageCrop: bundle.promoBannerBgImageCrop ?? null,
    loadingGif: bundle.loadingGif ?? null,
    tierConfig: bundle.tierConfig ?? null,
    showStepTimeline: bundle.showStepTimeline ?? null,
    steps,
    pricing: bundle.pricing
      ? {
          enabled: bundle.pricing.enabled,
          method: bundle.pricing.method,
          rules: bundle.pricing.rules ?? [],
          showFooter: bundle.pricing.showFooter,
          messages: bundle.pricing.messages ?? {},
        }
      : null,
  };
}
