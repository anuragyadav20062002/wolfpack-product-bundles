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
  stepFlow: { 
    imageSrc: "/tooltip-step-setup.avif",
    accessibilityLabel: "About Step Setup",
    fallbackTitle: "Step Flow",
    fallbackDescription: "Steps will render as navigation items on top of the bundle builder.",
   },
  category: { 
    imageSrc: "/tooltip-category.avif",
    accessibilityLabel: "About Categories",
    fallbackTitle: "Category",
    fallbackDescription: "Categories will appear as tabs inside each step.",
  },
  rulesConfiguration: {
    accessibilityLabel: "About Rules Configuration",
    fallbackTitle: "Rules Configuration",
    fallbackDescription: "Use step rules for one selection limit, or category rules when each category needs its own rule.",
  },
  bundleQuantityOptions: {
    imageSrc: "/tooltip-bundle-quantity-options.avif",
    accessibilityLabel: "About Bundle Quantity Options",
    fallbackTitle: "Bundle Quantity Options",
    fallbackDescription: "Show quantity-based discount rules as selectable bundle boxes. Each box can have its own label, subtext, and default rule.",
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
    fallbackTitle: "Progress Bar",
    fallbackDescription: "Show shoppers how close they are to the next discount. Simple uses one bar, while Step Based shows discount milestones.",
  },
  discountMessaging: {
    imageSrc: "/tooltip-discount-messaging.avif",
    accessibilityLabel: "About Discount Messaging",
    fallbackTitle: "Discount Messaging",
    fallbackDescription: "Customize the messages shown before a discount unlocks and after shoppers qualify.",
  },
  loadingAnimation: {},
  bundleVisibilityPending: {},
  variantSelector: {
    imageSrc: "/tooltip-variant-selector.avif",
    accessibilityLabel: "About Variant Selector",
    fallbackTitle: "Variant Selector",
    fallbackDescription: "Variant selection will appear as a dropdown on the product card.",
  },
  showTextOnAddButton: {
    imageSrc: "/tooltip-add-to-cart.avif",
    accessibilityLabel: "About Show Text on Add Button",
    fallbackTitle: "Product Slots",
    fallbackDescription: "Display text inside the 'Add to Cart' button on the product card.",
  },
  cartLineItemDiscountDisplay: {
    imageSrc: "/tooltip-cart-line-item.avif",
    accessibilityLabel: "About Cart Line Item Discount Display",
    fallbackTitle: "Cart Line Display",
  },
};
