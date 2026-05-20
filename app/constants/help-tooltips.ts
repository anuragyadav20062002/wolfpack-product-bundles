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
  | "loadingAnimation"
  | "bundleVisibilityPending";

export interface HelpTooltipDetails {
  visual?: HelpTooltipVisual;
  accessibilityLabel?: string;
}

export const HELP_TOOLTIPS: Record<HelpTooltipKey, HelpTooltipDetails> = {
  stepFlow: { visual: "step-flow" },
  category: { visual: "category" },
  rulesConfiguration: { visual: "rules" },
  bundleQuantityOptions: { visual: "quantity", accessibilityLabel: "About Bundle Quantity Options" },
  discountProgressBar: { visual: "progress", accessibilityLabel: "About Progress Bar" },
  discountMessaging: { visual: "messaging", accessibilityLabel: "About Discount Messaging" },
  loadingAnimation: { visual: "loading" },
  bundleVisibilityPending: {},
};
