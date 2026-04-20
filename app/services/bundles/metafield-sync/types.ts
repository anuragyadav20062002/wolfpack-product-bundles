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
  /** Widget style for product-page bundle (skai-lama-bottom-sheet-redesign).
   *  Absent = 'classic' — backward-compatible default. */
  widgetStyle?: 'classic' | 'bottom-sheet';
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
  /** If true, this step is a free gift step — unlocks after all paid steps complete. */
  isFreeGift?: boolean;
  /** Display name for the free gift (e.g. "cap", "greeting card"). */
  freeGiftName?: string;
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
