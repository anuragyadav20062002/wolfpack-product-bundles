export interface TourStep {
  title: string;
  body: string;
  targetSection: string;
}

export const FPB_TOUR_STEPS: TourStep[] = [
  {
    title: "Add products",
    body: "Add at least one product or collection to a bundle step so shoppers have options to choose.",
    targetSection: "fpb-step-setup",
  },
  {
    title: "Check app embed",
    body: "Confirm the theme app embed is enabled so the full-page bundle can render on the storefront.",
    targetSection: "fpb-readiness-score",
  },
  {
    title: "Place the bundle",
    body: "Place or link the full-page bundle so shoppers can open the bundle page from your storefront.",
    targetSection: "fpb-bundle-visibility",
  },
  {
    title: "Set active",
    body: "Set the parent product to Active after the required setup is saved.",
    targetSection: "fpb-bundle-visibility",
  },
];

export const PPB_TOUR_STEPS: TourStep[] = [
  {
    title: "Add products",
    body: "Choose the products customers can pick from in this product-page bundle.",
    targetSection: "ppb-product-selection",
  },
  {
    title: "Check app embed",
    body: "Confirm the theme app embed is enabled so the product-page widget can render on the storefront.",
    targetSection: "fpb-readiness-score",
  },
  {
    title: "Place the widget",
    body: "Use the widget placement controls so shoppers can see and open the bundle from the product page.",
    targetSection: "ppb-bundle-widget",
  },
  {
    title: "Set active",
    body: "Set the parent product to Active after the required setup is saved.",
    targetSection: "ppb-bundle-status",
  },
];

export const WIZARD_CONFIGURE_TOUR_STEPS: TourStep[] = [
  {
    title: "Check app embed",
    body: "The theme app extension must be enabled before any bundle can render on the storefront.",
    targetSection: "fpb-readiness-score",
  },
  {
    title: "Add products",
    body: "Add at least one product or collection to a step so shoppers have something to select.",
    targetSection: "wizard-select-product",
  },
  {
    title: "Place the bundle",
    body: "Save the bundle to write the storefront configuration, then place it on its storefront surface.",
    targetSection: "wizard-bundle-status",
  },
  {
    title: "Set active",
    body: "Set the bundle to Active so the storefront can render it for shoppers.",
    targetSection: "wizard-bundle-status",
  },
];
