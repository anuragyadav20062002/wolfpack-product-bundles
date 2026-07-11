import type { HelpTooltipKey } from "../../../constants/help-tooltips";
import {
  buildBundleVisibilityChildItems,
  buildConfigureSetupItems,
} from "../../../lib/bundle-config/common-configure-page-model";

export const fullPageTemplateOptions = [
  { presetId: "STANDARD", label: "Standard Design", image: "/FPB-Standard.avif" },
  { presetId: "CLASSIC", label: "Classic Design", image: "/FPB-Classic.avif" },
  { presetId: "COMPACT", label: "Compact Design", image: "/FPB-Compact.avif" },
  {
    presetId: "HORIZONTAL",
    label: "Horizontal Design",
    image: "/FPB-Horizontal.avif",
  },
] as const;

export type IndividualSellingPlanShowFor = "ALL_PRODUCTS" | "OOS_PRODUCTS";

export const FPB_DESIGN_CONTROL_PANEL_URL = "/app/settings";

export const bundleSetupItems = buildConfigureSetupItems("full_page");

export const stepSetupChildItems = [
  { id: "free_gift_addons", label: "Free Gift & Add Ons" },
];

export const ADDON_MESSAGE_KEY = "addons-direct";
export const ADDONS_HELP_ARTICLE_URL =
  "https://www.youtube.com/watch?v=5p_B81I7tWE";

export const bundleVisibilityChildItems =
  buildBundleVisibilityChildItems("full_page");

export const TEMPLATE_VARIABLES: [string, string][] = [
  [
    "{{discountConditionDiff}}",
    "The remaining quantity or monetary amount a customer needs to add to their cart to unlock the discount.",
  ],
  [
    "{{discountUnit}}",
    "The symbol for the discount requirement, such as your store's currency symbol ($) for amount-based rules.",
  ],
  [
    "{{discountValue}}",
    "The numerical value of the discount reward itself (e.g., the '10' in a 10% or $10 discount).",
  ],
  [
    "{{discountValueUnit}}",
    "The symbol used for the discount reward, such as the percent sign (%) or the store's currency symbol ($).",
  ],
  [
    "{{discountedItems}}",
    'The quantity of items that will be discounted or given free as part of the "Get Y" offer.',
  ],
];

export const ADDON_TEMPLATE_VARIABLES: [string, string][] = [
  [
    "{{addonsConditionDiff}}",
    "Shows how much more the customer needs to add to qualify",
  ],
  ["{{currencyUnit}}", "Currency Symbol"],
  [
    "{{addonsDiscountValue}}",
    "Displays the final discount your customer will receive on the add-ons",
  ],
  ["{{addonsDiscountValueUnit}}", "Discount type (e.g., %)"],
];

export type { HelpTooltipKey };
