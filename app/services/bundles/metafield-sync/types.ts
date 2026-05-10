/**
 * Metafield Sync Types
 *
 * Type definitions for metafield synchronization operations
 */

/**
 * Component pricing interface for expanded bundle checkout display
 * All prices stored in base currency cents (subunits) as integers
 */
export interface ComponentPricing {
  variantId: string;        // "gid://shopify/ProductVariant/123"
  title?: string;           // Product title (for checkout display)
  retailPrice: number;      // 9800 (cents) = $98.00
  bundlePrice: number;      // 8820 (cents) = $88.20
  discountPercent: number;  // 10.00 (percentage)
  savingsAmount: number;    // 980 (cents) = $9.80
}

/**
 * Metafield size check result
 */
export interface MetafieldSizeCheck {
  size: number;
  withinLimit: boolean;
  warningLevel: 'none' | 'warning' | 'critical' | 'exceeded';
}

/**
 * Price adjustment configuration for cart transform
 */
export interface PriceAdjustment {
  method: string;
  value: number;
  conditions?: {
    type: string;
    operator: string;
    value: number;
  };
}

/**
 * Bundle UI configuration for widget
 */
export interface BundleUiConfig {
  id: string;
  bundleId: string;
  name: string;
  description: string;
  status: string;
  bundleType: string;
  shopifyProductId: string | null;
  fullPagePageHandle?: string | null;
  bundleVariantId: string;
  steps: BundleUiStep[];
  pricing: BundleUiPricing | null;
  messaging: BundleUiMessaging;
  promoBannerBgImage?: string | null;
  promoBannerBgImageCrop?: string | null;
  loadingGif?: string | null;
  /** Widget style for product-page bundle.
   *  Absent = 'classic' — backward-compatible default. */
  widgetStyle?: 'classic' | 'bottom-sheet';
  /** Show fixed-position floating promo badge on storefront (bottom-left). */
  floatingBadgeEnabled?: boolean;
  /** Text shown in the floating promo badge (max 60 chars). */
  floatingBadgeText?: string;
  /** Per-bundle English text overrides for widget strings. */
  textOverrides?: BundleTextOverrides | null;
  /** Per-locale text overrides keyed by Shopify locale code (e.g. "fr", "de"). */
  textOverridesByLocale?: Record<string, Partial<BundleTextOverrides>> | null;
  /** When true, loads the headless SDK instead of the pre-built widget (product-page bundles only). */
  sdkMode?: boolean;
}

export interface BundleUiStep {
  id: string;
  name: string;
  position: number;
  minQuantity: number;
  maxQuantity: number;
  products: { id: string }[];
  conditionType?: string;
  conditionOperator?: string;
  conditionValue?: string;
  conditionOperator2?: string;
  conditionValue2?: string;
  /** If true, this step is a free gift / add-on step. */
  isFreeGift?: boolean;
  /** Legacy display name for the free gift. Superseded by addonLabel. */
  freeGiftName?: string;
  /** Add-on step tab label (shown in step navigator). */
  addonLabel?: string | null;
  /** Add-on step panel heading. */
  addonTitle?: string | null;
  /** URL of uploaded icon for the add-on step tab. */
  addonIconUrl?: string | null;
  /** Show products at $0.00 in this step. */
  addonDisplayFree?: boolean;
  /** Lock this step tab until prior steps meet minQuantity. */
  addonUnlockAfterCompletion?: boolean;
  /** If true, this step is pre-filled and not shown in the bottom-sheet modal tabs. */
  isDefault?: boolean;
  /** Variant ID pre-selected for default steps. */
  defaultVariantId?: string;
  /** Badge label shown on the inline filled card (e.g. "FREE", "20% off"). */
  discountBadgeLabel?: string;
  /** URL for the category image shown in the empty slot card. */
  categoryImageUrl?: string;
  /** URL for the step's timeline icon (user-uploadable; separate from bannerImageUrl). */
  timelineIconUrl?: string;
  /** Merchant-chosen option dimension rendered as button group on product cards (e.g. "Size"). */
  primaryVariantOption?: string | null;
}

export interface BundleUiPricing {
  enabled: boolean;
  method: string;
  rules: BundleUiPricingRule[];
}

export interface BundleUiPricingRule {
  condition: {
    type: string;
    operator: string;
    value: number;
  } | null;
  discount: {
    method: string;
    value: number;
  };
}

export interface BundleUiMessaging {
  progressTemplate: string;
  successTemplate: string;
  showFooter: boolean;
  showDiscountMessaging?: boolean;
  showDiscountProgressBar?: boolean;
}

/** Overridable user-visible strings in the bundle widget. */
export interface BundleTextOverrides {
  /** Primary CTA button — "Add to Cart" / "Add Bundle to Cart" */
  addToCartButton?: string;
  /** Footer next-step button — "Next" */
  nextButton?: string;
  /** Footer last-step button — "Done" */
  doneButton?: string;
  /** Free gift product badge — "Free" */
  freeBadge?: string;
  /** Already-included product badge — "Included" */
  includedBadge?: string;
  /** Sidebar / sheet header title (FPB) — "Your Bundle" */
  yourBundle?: string;
  /** ATC loading state — "Adding to Cart..." */
  addingToCart?: string;
  /** PDP incomplete-steps state — "Complete All Steps to Continue" */
  completeSteps?: string;
}

/**
 * Component parents data for MERGE operation
 */
export interface ComponentParentsData {
  id: string;
  component_reference: {
    value: string[];
  };
  component_quantities: {
    value: number[];
  };
  price_adjustment: PriceAdjustment;
}
