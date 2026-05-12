export const HELP_TOOLTIP_VISUALS = [
  "step-flow",
  "category",
  "rules",
  "quantity",
  "progress",
  "messaging",
  "loading",
] as const;

export type HelpTooltipVisual = typeof HELP_TOOLTIP_VISUALS[number];

export type HelpTooltipKey =
  | "stepFlow"
  | "category"
  | "rulesConfiguration"
  | "bundleQuantityOptions"
  | "discountProgressBar"
  | "discountMessaging"
  | "loadingAnimation";

export interface HelpTooltipDetails {
  title: string;
  description: string;
  visual: HelpTooltipVisual;
  accessibilityLabel?: string;
}

export const HELP_TOOLTIPS: Record<HelpTooltipKey, HelpTooltipDetails> = {
  stepFlow: {
    title: "Step Flow",
    description: "Steps will render as navigation items on top of the bundle builder",
    visual: "step-flow",
  },
  category: {
    title: "Category",
    description: "Categories will appear as tabs inside each step",
    visual: "category",
  },
  rulesConfiguration: {
    title: "Rules guide shopper selections",
    description: "Use step rules for one selection limit, or category rules when each category needs its own rule.",
    visual: "rules",
  },
  bundleQuantityOptions: {
    title: "Bundle Quantity Options",
    description: "Show quantity-based discount rules as selectable bundle boxes. Each box can have its own label, subtext, and default rule.",
    visual: "quantity",
    accessibilityLabel: "About Bundle Quantity Options",
  },
  discountProgressBar: {
    title: "Progress Bar",
    description: "Show shoppers how close they are to the next discount. Simple uses one bar, while Step Based shows discount milestones.",
    visual: "progress",
    accessibilityLabel: "About Progress Bar",
  },
  discountMessaging: {
    title: "Discount Messaging",
    description: "Customize the messages shown before a discount unlocks and after shoppers qualify.",
    visual: "messaging",
    accessibilityLabel: "About Discount Messaging",
  },
  loadingAnimation: {
    title: "Storefront Loading Animation",
    description: "Shown while Wolfpack Bundles loads bundle content on the storefront.",
    visual: "loading",
  },
};
