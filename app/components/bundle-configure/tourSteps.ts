export interface TourStep {
  title: string;
  body: string;
  targetSection: string;
}

export const FPB_TOUR_STEPS: TourStep[] = [
  {
    title: "Your Steps & Products",
    body: "Add the products customers can choose from, organised into steps.",
    targetSection: "fpb-step-setup",
  },
  {
    title: "Discount & Pricing",
    body: "Set how much customers save when they complete the bundle.",
    targetSection: "fpb-discount-pricing",
  },
  {
    title: "Design & Appearance",
    body: "Customise how the bundle looks on your storefront.",
    targetSection: "fpb-design-settings",
  },
  {
    title: "Bundle Placement",
    body: "Place your bundle on a product page or a dedicated full-page embed.",
    targetSection: "fpb-bundle-visibility",
  },
  {
    title: "Your Readiness Score",
    body: "Tracks everything left before your bundle is ready to sell — it lives in the bottom-left corner.",
    targetSection: "fpb-readiness-score",
  },
];

export const PPB_TOUR_STEPS: TourStep[] = [
  {
    title: "Select Your Products",
    body: "Choose the products customers will pick from in this bundle.",
    targetSection: "ppb-product-selection",
  },
  {
    title: "Discount & Pricing",
    body: "Set how much customers save when they complete the bundle.",
    targetSection: "ppb-discount-pricing",
  },
  {
    title: "Design & Appearance",
    body: "Customise how the bundle looks on the product page.",
    targetSection: "ppb-design-settings",
  },
  {
    title: "Bundle Status",
    body: "Set your bundle to Active when you're ready for customers to see it.",
    targetSection: "ppb-bundle-status",
  },
];

export const WIZARD_CONFIGURE_TOUR_STEPS: TourStep[] = [
  {
    title: "Configure Your Step",
    body: "Set a name and icon for this bundle step. The step name appears in the widget navigation.",
    targetSection: "wizard-step-config",
  },
  {
    title: "Add Products",
    body: "Select the products customers can choose from in this step. Browse by product or collection.",
    targetSection: "wizard-select-product",
  },
  {
    title: "Set Rules",
    body: "Define conditions like minimum quantity to control how customers make their selection.",
    targetSection: "wizard-rules",
  },
  {
    title: "Bundle Status",
    body: "Set your bundle to Active when you're ready for customers to see it, or keep it as Draft while configuring.",
    targetSection: "wizard-bundle-status",
  },
];
