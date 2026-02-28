/**
 * Bundle Domain Constants
 *
 * Centralized enums and form select options for bundle configuration.
 * Import these instead of using inline string literals or duplicated arrays.
 */

import {
  DiscountMethod,
  ConditionType,
  ConditionOperator,
} from "../types/pricing";

// ============================================
// ENUMS
// ============================================

export enum BundleStatus {
  ACTIVE = "active",
  DRAFT = "draft",
  ARCHIVED = "archived",
}

export enum BundleType {
  PRODUCT_PAGE = "product_page",
  FULL_PAGE = "full_page",
  CART_TRANSFORM = "cart_transform",
}

export enum FullPageLayout {
  FOOTER_BOTTOM = "footer_bottom",
  FOOTER_SIDE = "footer_side",
}

// ============================================
// FORM SELECT OPTIONS
// ============================================

/** Status options for bundle configuration forms */
export const BUNDLE_STATUS_OPTIONS = [
  { label: "Active", value: BundleStatus.ACTIVE },
  { label: "Draft", value: BundleStatus.DRAFT },
  { label: "Unlisted", value: BundleStatus.ARCHIVED },
] as const;

/** Bundle type options for the DCP selector */
export const BUNDLE_TYPE_OPTIONS = [
  { label: "Product Page Bundle", value: BundleType.PRODUCT_PAGE },
  { label: "Full Page Bundle", value: BundleType.FULL_PAGE },
] as const;

// ============================================
// STEP CONDITION OPTIONS
// ============================================

/** Condition type options for step condition rules */
export const STEP_CONDITION_TYPE_OPTIONS = [
  { label: "Quantity", value: "quantity" },
  { label: "Amount", value: "amount" },
] as const;

/** Operator options for step condition rules */
export const STEP_CONDITION_OPERATOR_OPTIONS = [
  { label: "is equal to", value: "equal_to" },
  { label: "is greater than", value: "greater_than" },
  { label: "is less than", value: "less_than" },
  { label: "is greater than or equal to", value: "greater_than_or_equal_to" },
  { label: "is less than or equal to", value: "less_than_or_equal_to" },
] as const;

// ============================================
// DISCOUNT RULE OPTIONS
// ============================================

/** Discount method options for pricing rules */
export const DISCOUNT_METHOD_OPTIONS = [
  { label: "Percentage Off", value: DiscountMethod.PERCENTAGE_OFF },
  { label: "Fixed Amount Off", value: DiscountMethod.FIXED_AMOUNT_OFF },
  { label: "Fixed Bundle Price", value: DiscountMethod.FIXED_BUNDLE_PRICE },
] as const;

/** Condition type options for discount rules */
export const DISCOUNT_CONDITION_TYPE_OPTIONS = [
  { label: "Quantity", value: ConditionType.QUANTITY },
  { label: "Amount", value: ConditionType.AMOUNT },
] as const;

/** Operator options for discount rules */
export const DISCOUNT_OPERATOR_OPTIONS = [
  { label: "Greater than or equal (\u2265)", value: ConditionOperator.GTE },
  { label: "Greater than (>)", value: ConditionOperator.GT },
  { label: "Less than or equal (\u2264)", value: ConditionOperator.LTE },
  { label: "Less than (<)", value: ConditionOperator.LT },
  { label: "Equal to (=)", value: ConditionOperator.EQ },
] as const;
