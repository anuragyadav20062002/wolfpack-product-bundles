export type HelpTooltipKey =
  | "stepFlow"
  | "category"
  | "rulesConfiguration"
  | "bundleQuantityOptions"
  | "productSlots"
  | "discountProgressBar"
  | "discountMessaging"
  | "loadingAnimation"
  | "bundleVisibilityPending"
  | "variantSelector"
  | "showTextOnAddButton"
  | "cartLineItemDiscountDisplay";

export interface HelpTooltipDetails {
  imageSrc?: string;
  accessibilityLabel?: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export const HELP_TOOLTIPS: Record<HelpTooltipKey, HelpTooltipDetails> = {
  stepFlow: { imageSrc: "/tooltip-step-setup.avif" },
  category: { imageSrc: "/tooltip-category.avif" },
  rulesConfiguration: {},
  bundleQuantityOptions: {
    imageSrc: "/tooltip-bundle-quantity-options.avif",
    accessibilityLabel: "About Bundle Quantity Options",
  },
  productSlots: {
    imageSrc: "/tooltip-product-slots.avif",
    accessibilityLabel: "About Product Slots",
    fallbackTitle: "Product Slots",
    fallbackDescription: "Display empty slots on the storefront and use the configured Slot Icon for those empty slots.",
  },
  discountProgressBar: {
    imageSrc: "/tooltip-discount-progress.avif",
    accessibilityLabel: "About Progress Bar",
  },
  discountMessaging: {
    imageSrc: "/tooltip-discount-messaging.avif",
    accessibilityLabel: "About Discount Messaging",
  },
  loadingAnimation: {},
  bundleVisibilityPending: {},
  variantSelector: {
    imageSrc: "/tooltip-variant-selector.avif",
    accessibilityLabel: "About Variant Selector",
  },
  showTextOnAddButton: {
    imageSrc: "/tooltip-add-to-cart.avif",
    accessibilityLabel: "About Show Text on Add Button",
  },
  cartLineItemDiscountDisplay: {
    imageSrc: "/tooltip-cart-line-item.avif",
    accessibilityLabel: "About Cart Line Item Discount Display",
  },
};
