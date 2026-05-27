export type BundleContractType = "full_page" | "product_page";

export type FullPageTemplateKey = "standard" | "classic" | "compact" | "horizontal";
export type ProductPageTemplateKey = "product-list" | "product-grid" | "horizontal-slots" | "vertical-slots";
export type TemplateKey = FullPageTemplateKey | ProductPageTemplateKey;

export interface TemplateSelection {
  bundleDesignTemplate: "FBP_SIDE_FOOTER" | "PDP_INPAGE" | "PDP_MODAL";
  bundleDesignPresetId: "DEFAULT" | "CLASSIC" | "COMPACT" | "HORIZONTAL" | "CASCADE" | "COGNIVE" | "MODAL" | "SIMPLIFIED";
  templateId: "CASCADE" | "COGNIVE" | "MODAL" | "SIMPLIFIED" | null;
}

const FULL_PAGE_TEMPLATE_MAP: Record<FullPageTemplateKey, TemplateSelection> = {
  standard: {
    bundleDesignTemplate: "FBP_SIDE_FOOTER",
    bundleDesignPresetId: "DEFAULT",
    templateId: null,
  },
  classic: {
    bundleDesignTemplate: "FBP_SIDE_FOOTER",
    bundleDesignPresetId: "CLASSIC",
    templateId: null,
  },
  compact: {
    bundleDesignTemplate: "FBP_SIDE_FOOTER",
    bundleDesignPresetId: "COMPACT",
    templateId: null,
  },
  horizontal: {
    bundleDesignTemplate: "FBP_SIDE_FOOTER",
    bundleDesignPresetId: "HORIZONTAL",
    templateId: null,
  },
};

const PRODUCT_PAGE_TEMPLATE_MAP: Record<ProductPageTemplateKey, TemplateSelection> = {
  "product-list": {
    bundleDesignTemplate: "PDP_INPAGE",
    bundleDesignPresetId: "CASCADE",
    templateId: "CASCADE",
  },
  "product-grid": {
    bundleDesignTemplate: "PDP_INPAGE",
    bundleDesignPresetId: "COGNIVE",
    templateId: "COGNIVE",
  },
  "horizontal-slots": {
    bundleDesignTemplate: "PDP_MODAL",
    bundleDesignPresetId: "MODAL",
    templateId: "MODAL",
  },
  "vertical-slots": {
    bundleDesignTemplate: "PDP_MODAL",
    bundleDesignPresetId: "SIMPLIFIED",
    templateId: "SIMPLIFIED",
  },
};

export function mapTemplateSelection(bundleType: "full_page", templateKey: TemplateKey): TemplateSelection;
export function mapTemplateSelection(bundleType: "product_page", templateKey: TemplateKey): TemplateSelection;
export function mapTemplateSelection(bundleType: BundleContractType, templateKey: TemplateKey): TemplateSelection {
  const selection = bundleType === "full_page"
    ? FULL_PAGE_TEMPLATE_MAP[templateKey as FullPageTemplateKey]
    : PRODUCT_PAGE_TEMPLATE_MAP[templateKey as ProductPageTemplateKey];

  if (!selection) {
    throw new Error(`Invalid template key "${templateKey}" for ${bundleType}`);
  }

  return { ...selection };
}

export function getStorefrontConfigLoadPlan(bundleType: BundleContractType): string[] {
  if (bundleType === "full_page") {
    return [
      "metafield-cache",
      "proxy-api-fallback",
      "proxy-api-503-504-retry",
    ];
  }

  return ["product-page-config"];
}
