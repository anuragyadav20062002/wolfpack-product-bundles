import type { HelpTooltipKey } from "../../../constants/help-tooltips";

export const fullPageTemplateOptions = [
  { presetId: "DEFAULT",    label: "Standard Design",   image: "/FPB-Standard.png"     },
  { presetId: "CLASSIC",    label: "Classic Design",    image: "/FPB-Classic.png"      },
  { presetId: "COMPACT",    label: "Compact Design",    image: "/FPB-Compact..png"    },
  { presetId: "HORIZONTAL", label: "Horizontal Design", image: "/FPB-Horizontal.png"   },
] as const;

export type IndividualSellingPlanShowFor = "ALL_PRODUCTS" | "OOS_PRODUCTS";

export const FPB_DESIGN_CONTROL_PANEL_URL = "/app/settings";

export const bundleSetupItems = [
  { id: "step_setup",        label: "Step Setup",         iconType: "note",   fullPageOnly: false },
  { id: "discount_pricing",  label: "Discount & Pricing", iconType: "filter", fullPageOnly: false },
  { id: "bundle_visibility", label: "Bundle Visibility",  iconType: "view",   fullPageOnly: true  },
  { id: "bundle_settings",   label: "Bundle Settings",    iconType: "edit",   fullPageOnly: false },
  { id: "select_template",   label: "Select Template",    iconType: "paint-brush-flat", fullPageOnly: false },
];

export const stepSetupChildItems = [
  { id: "free_gift_addons", label: "Free Gift & Add Ons" },
];

export const ADDON_MESSAGE_KEY = "addons-direct";
export const ADDONS_HELP_ARTICLE_URL = "https://wolfpackapps.com";

export const bundleVisibilityChildItems = [
  { id: "bundle_widget", label: "Bundle Widget" },
];

export const TEMPLATE_VARIABLES: [string, string][] = [
  ["{{discountConditionDiff}}", "The remaining quantity or monetary amount a customer needs to add to their cart to unlock the discount."],
  ["{{discountUnit}}", "The symbol for the discount requirement, such as your store's currency symbol ($) for amount-based rules."],
  ["{{discountValue}}", "The numerical value of the discount reward itself (e.g., the '10' in a 10% or $10 discount)."],
  ["{{discountValueUnit}}", "The symbol used for the discount reward, such as the percent sign (%) or the store's currency symbol ($)."],
  ["{{discountedItems}}", "The quantity of items that will be discounted or given free as part of the \"Get Y\" offer."],
];

export const ADDON_TEMPLATE_VARIABLES: [string, string][] = [
  ["{{addonsConditionDiff}}", "Shows how much more the customer needs to add to qualify"],
  ["{{currencyUnit}}", "Currency Symbol"],
  ["{{addonsDiscountValue}}", "Displays the final discount your customer will receive on the add-ons"],
  ["{{addonsDiscountValueUnit}}", "Discount type (e.g., %)"],
];

export type { HelpTooltipKey };
