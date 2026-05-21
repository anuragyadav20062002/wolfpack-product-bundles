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
    title: "Enable App Embed",
    body: "The theme app extension must be enabled before any bundle can render on the storefront.",
    targetSection: "fpb-readiness-score",
  },
  {
    title: "Add Products",
    body: "Add at least one product or collection to a step so shoppers have something to select.",
    targetSection: "wizard-select-product",
  },
  {
    title: "Place The Bundle",
    body: "Save the bundle to write the storefront configuration, then place it on its storefront surface.",
    targetSection: "wizard-bundle-status",
  },
  {
    title: "Set Active",
    body: "Set the bundle to Active so the storefront can render it for shoppers.",
    targetSection: "wizard-bundle-status",
  },
];
