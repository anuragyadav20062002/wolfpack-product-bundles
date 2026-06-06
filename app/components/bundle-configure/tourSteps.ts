export interface TourStep {
  title: string;
  body: string;
  targetSection: string;
  sectionId?: string;
}

export const FPB_TOUR_STEPS: TourStep[] = [
  {
    title: "Add products",
    body: "Add at least one product or collection to a bundle step so shoppers have options to choose.",
    targetSection: "fpb-step-setup",
    sectionId: "step_setup",
  },
  {
    title: "Check app embed",
    body: "Confirm the theme app embed is enabled so the full-page bundle can render on the storefront.",
    targetSection: "fpb-readiness-score",
    sectionId: "step_setup",
  },
  {
    title: "Place the bundle",
    body: "Place or link the full-page bundle so shoppers can open the bundle page from your storefront.",
    targetSection: "fpb-bundle-visibility",
    sectionId: "bundle_visibility",
  },
  {
    title: "Set active",
    body: "Set the parent product to Active after the required setup is saved.",
    targetSection: "fpb-bundle-visibility",
    sectionId: "bundle_visibility",
  },
];

export const PPB_TOUR_STEPS: TourStep[] = [
  {
    title: "Add products",
    body: "Choose the products customers can pick from in this product-page bundle.",
    targetSection: "ppb-product-selection",
    sectionId: "step_setup",
  },
  {
    title: "Check app embed",
    body: "Confirm the theme app embed is enabled so the product-page widget can render on the storefront.",
    targetSection: "fpb-readiness-score",
    sectionId: "step_setup",
  },
  {
    title: "Place the widget",
    body: "Use the widget placement controls so shoppers can see and open the bundle from the product page.",
    targetSection: "ppb-bundle-widget",
    sectionId: "bundle_widget",
  },
  {
    title: "Set active",
    body: "Set the parent product to Active after the required setup is saved.",
    targetSection: "ppb-bundle-status",
    sectionId: "bundle_settings",
  },
];
