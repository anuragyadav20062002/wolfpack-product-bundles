/**
 * Wolfpack Bundles SDK — TypeScript Definitions
 *
 * Usage: add to your tsconfig.json `include` or reference with:
 *   /// <reference path="path/to/wolfpack-bundles.d.ts" />
 *
 * Global: window.WolfpackBundles
 */

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface Step {
  id: string;
  name: string;
  conditionType: string | null;
  conditionOperator: string | null;
  conditionValue: number | null;
  conditionOperator2?: string | null;
  conditionValue2?: number | null;
  minQuantity?: number | null;
  isFreeGift: boolean;
  isDefault: boolean;
  products?: Product[];
}

export interface Product {
  id?: string | number;
  variantId?: string | number;
  title: string;
  price: number;       // cents
  available: boolean;
  variants?: Variant[];
}

export interface Variant {
  id: string | number;
  title?: string;
  price: number;       // cents
  available: boolean;
}

export interface DiscountRule {
  condition: {
    type: 'quantity' | 'amount';
    operator: 'gte' | 'gt' | 'lte' | 'lt' | 'eq';
    value: number;
  };
  discount: {
    method: 'percentage_off' | 'fixed_amount_off' | 'fixed_bundle_price';
    value: number;
  };
}

export interface DiscountConfiguration {
  enabled: boolean;
  rules: DiscountRule[];
}

// ─── SDK State ────────────────────────────────────────────────────────────────

/** Read-only snapshot of the current bundle state. */
export interface WolfpackBundleState {
  /** True once the SDK has parsed the bundle config and is ready to accept API calls. */
  readonly isReady: boolean;
  readonly bundleId: string | null;
  readonly bundleName: string | null;
  /** All steps configured for this bundle in the App Admin. */
  readonly steps: Step[];
  /**
   * Current selections: stepId → variantId (string) → quantity.
   * Example: { "step_abc": { "12345678": 2 } }
   */
  readonly selections: Record<string, Record<string, number>>;
  readonly discountConfiguration: DiscountConfiguration | null;
}

// ─── Return Types ─────────────────────────────────────────────────────────────

export interface AddRemoveResult {
  success: boolean;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  /** Human-readable message explaining why the step is invalid. Empty string when valid. */
  message: string;
}

export interface BundleValidationResult {
  valid: boolean;
  /** Map of stepId → error message for every failing step. Empty object when valid. */
  errors: Record<string, string>;
}

export interface DisplayPrice {
  /** Raw subtotal before discount, in cents. */
  original: number;
  /** Discounted total, in cents. Equals `original` when no discount applies. */
  discounted: number;
  /** Amount saved, in cents. */
  savings: number;
  /** Savings as a percentage of the original price, rounded to 1 decimal place. */
  savingsPercent: number;
  /** Locale-aware formatted string of the discounted price (e.g. "$80.00"). */
  formatted: string;
}

// ─── SDK Interface ────────────────────────────────────────────────────────────

export interface WolfpackBundleSDK {
  /** Live read-only state snapshot. Always reflects the latest selections. */
  readonly state: WolfpackBundleState;

  /**
   * Add `qty` units of `variantId` to `stepId`.
   * Validates against the step's min/max condition before mutating state.
   * Fires `wbp:item-added` on success.
   */
  addItem(stepId: string, variantId: string | number, qty: number): AddRemoveResult;

  /**
   * Remove `qty` units of `variantId` from `stepId`.
   * If quantity reaches 0, the variant is removed from selections entirely.
   * Fires `wbp:item-removed` on success.
   */
  removeItem(stepId: string, variantId: string | number, qty: number): AddRemoveResult;

  /**
   * Clear all selections in `stepId`.
   * Fires `wbp:step-cleared` on success.
   */
  clearStep(stepId: string): { success: boolean; error?: string };

  /**
   * Async AJAX add-to-cart via Shopify's `/cart/add.js`.
   * Validates the bundle first; fires `wbp:cart-failed` if invalid.
   * Fires `wbp:cart-success` on success, `wbp:cart-failed` on network/cart error.
   * Does NOT redirect the customer — handle redirect/drawer in your event listener.
   */
  addBundleToCart(): Promise<void>;

  /**
   * Validate a single step's current selections against its configured condition.
   * Use to gate "Next" buttons or show per-step progress indicators.
   */
  validateStep(stepId: string): ValidationResult;

  /**
   * Validate all required steps (skips free-gift and default steps).
   * Use to gate the "Add to Cart" button.
   */
  validateBundle(): BundleValidationResult;

  /**
   * Calculate display prices for the current selections, applying any configured discount.
   * All numeric values are in cents. Use `formatted` for display.
   * Note: actual checkout discount is applied by the App's Cart Transform — this is for UI display only.
   */
  getDisplayPrice(): DisplayPrice;
}

// ─── Window Events ────────────────────────────────────────────────────────────

export interface WbpReadyDetail {
  bundleId: string;
  steps: Step[];
}

export interface WbpItemAddedDetail {
  stepId: string;
  variantId: string;
  qty: number;
  selections: Record<string, Record<string, number>>;
}

export interface WbpItemRemovedDetail {
  stepId: string;
  variantId: string;
  qty: number;
  selections: Record<string, Record<string, number>>;
}

export interface WbpStepClearedDetail {
  stepId: string;
}

export interface WbpCartSuccessDetail {
  bundleId: string;
}

export interface WbpCartFailedDetail {
  error: string;
}

// ─── Global Augmentation ─────────────────────────────────────────────────────

declare global {
  interface Window {
    /** Wolfpack Bundles SDK. Available after the `wbp:ready` event fires. */
    WolfpackBundles: WolfpackBundleSDK | undefined;
  }

  interface WindowEventMap {
    'wbp:ready': CustomEvent<WbpReadyDetail>;
    'wbp:item-added': CustomEvent<WbpItemAddedDetail>;
    'wbp:item-removed': CustomEvent<WbpItemRemovedDetail>;
    'wbp:step-cleared': CustomEvent<WbpStepClearedDetail>;
    'wbp:cart-success': CustomEvent<WbpCartSuccessDetail>;
    'wbp:cart-failed': CustomEvent<WbpCartFailedDetail>;
  }
}
