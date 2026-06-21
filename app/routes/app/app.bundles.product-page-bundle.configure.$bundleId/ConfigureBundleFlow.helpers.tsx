import { useRef, useState, memo } from "react";
import { useTranslation } from "react-i18next";
import { HelpTooltipImage } from "../../../components/HelpTooltipImage";
import {
  HELP_TOOLTIPS,
  type HelpTooltipKey,
} from "../../../constants/help-tooltips";
import { PRODUCT_PAGE_SETUP_ITEMS } from "../../../lib/bundle-config/product-page-admin-sections";
import productPageBundleStyles from "../../../styles/routes/product-page-bundle-configure.module.css";
import type { BundleProductCardProps } from "./types";

export const ADDON_TEMPLATE_VARIABLES: [string, string][] = [
  [
    "{{addonsConditionDiff}}",
    "The remaining quantity a customer needs to add to unlock the add-on discount.",
  ],
  [
    "{{addonsDiscountValue}}",
    "The numerical value of the add-on discount (e.g. the '10' in 10% off).",
  ],
  [
    "{{addonsDiscountValueUnit}}",
    "The unit symbol for the add-on discount (% or $).",
  ],
];

export const DISCOUNT_TEMPLATE_VARIABLES: [string, string][] = [
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

export const bundleSetupItems = PRODUCT_PAGE_SETUP_ITEMS;

export const bundleVisibilityChildItems = [
  { id: "bundle_widget", label: "Bundle Widget" },
  { id: "bundle_embed", label: "Bundle Embed" },
];

export const productPageTemplateOptions = [
  {
    presetId: "CASCADE",
    layoutTemplate: "PDP_INPAGE",
    label: "Product List",
    image: "/PPB-List.png",
  },
  {
    presetId: "MODAL",
    layoutTemplate: "PDP_MODAL",
    label: "Horizontal Slots",
    image: "/PPB-HorizontalSlots.png",
  },
  {
    presetId: "COGNIVE",
    layoutTemplate: "PDP_INPAGE",
    label: "Product Grid",
    image: "/PPB-Grid.png",
  },
  {
    presetId: "SIMPLIFIED",
    layoutTemplate: "PDP_MODAL",
    label: "Vertical Slots",
    image: "/PPB-VerticalSlots.png",
  },
] as const;

export const PPB_DESIGN_CONTROL_PANEL_URL = "/app/settings";

type VisibilityDisplayConfiguration = {
  showOnAllBundleProducts: boolean;
  selectedProducts: unknown[];
  showOnSpecificProductPages: unknown[];
  collectionsSelectedData: unknown[];
  showOnSpecificCollectionPages: unknown[];
};

export type StepSetupMultiLanguageTarget =
  | { type: "text-overrides" }
  | { type: "step"; stepId: string }
  | { type: "step-category"; stepId: string; categoryIndex: number };

export function asVisibilityArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function getVisibilityDisplayTarget(
  displayConfiguration:
    | Partial<VisibilityDisplayConfiguration>
    | null
    | undefined,
  allValue: string,
): string {
  if (!displayConfiguration) return allValue;
  if (
    asVisibilityArray(displayConfiguration.collectionsSelectedData).length >
      0 ||
    asVisibilityArray(displayConfiguration.showOnSpecificCollectionPages)
      .length > 0
  ) {
    return "specific_collections";
  }
  if (
    asVisibilityArray(displayConfiguration.selectedProducts).length > 0 ||
    asVisibilityArray(displayConfiguration.showOnSpecificProductPages).length >
      0
  ) {
    return "specific_products";
  }
  return displayConfiguration.showOnAllBundleProducts === false
    ? "specific_products"
    : allValue;
}

export function buildVisibilityDisplayConfiguration(
  displayOn: string | null | undefined,
  selectedProducts: unknown[] = [],
  showOnSpecificProductPages: unknown[] = [],
  collectionsSelectedData: unknown[] = [],
  showOnSpecificCollectionPages: unknown[] = [],
): VisibilityDisplayConfiguration {
  const showOnAllBundleProducts =
    displayOn === "all" || displayOn === "all_products";
  const productPageTargets =
    showOnSpecificProductPages.length > 0
      ? showOnSpecificProductPages
      : selectedProducts;
  const collectionPageTargets =
    showOnSpecificCollectionPages.length > 0
      ? showOnSpecificCollectionPages
      : collectionsSelectedData;

  return {
    showOnAllBundleProducts,
    selectedProducts:
      displayOn === "specific_products"
        ? selectedProducts.map((product) =>
            compactVisibilityProductReference(product),
          )
        : [],
    showOnSpecificProductPages:
      displayOn === "specific_products"
        ? productPageTargets.map((product) =>
            compactVisibilityProductPageReference(product),
          )
        : [],
    collectionsSelectedData:
      displayOn === "specific_collections"
        ? collectionsSelectedData.map((collection) =>
            compactVisibilityCollectionReference(collection),
          )
        : [],
    showOnSpecificCollectionPages:
      displayOn === "specific_collections"
        ? collectionPageTargets.map((collection) =>
            compactVisibilityCollectionPageReference(collection),
          )
        : [],
  };
}

export function getVisibilityResourceId(resource: any): string | null {
  return (
    resource?.graphqlId ??
    resource?.admin_graphql_api_id ??
    resource?.storefrontId ??
    resource?.id ??
    null
  );
}

function getVisibilityResourceNumericId(resource: any): string {
  const id = String(
    resource?.productId ??
      resource?.collectionId ??
      getVisibilityResourceId(resource) ??
      "",
  );
  return id.includes("/") ? (id.split("/").pop() ?? id) : id;
}

function getVisibilityImageUrl(resource: any): string | null {
  return (
    resource?.imageUrl ??
    resource?.featuredImage?.url ??
    resource?.image?.url ??
    resource?.image?.src ??
    resource?.images?.[0]?.originalSrc ??
    resource?.images?.[0]?.url ??
    resource?.images?.[0]?.src ??
    null
  );
}

export function getVisibilityPickerSelection(picked: any): any[] | null {
  if (Array.isArray(picked)) return picked;
  if (Array.isArray(picked?.selection)) return picked.selection;
  return null;
}

export function buildVisibilitySelectionIds(resources: unknown[]) {
  return resources
    .map((resource: any) => getVisibilityResourceId(resource))
    .filter((id): id is string => typeof id === "string" && id.length > 0)
    .map((id) => ({ id }));
}

function compactVisibilityImages(resource: any) {
  const imageUrl = getVisibilityImageUrl(resource);
  return imageUrl ? [{ originalSrc: imageUrl }] : [];
}

function compactVisibilityProductReference(product: any) {
  const graphqlId = getVisibilityResourceId(product);
  const imageUrl = getVisibilityImageUrl(product);

  return {
    id: graphqlId,
    productId: getVisibilityResourceNumericId(product),
    graphqlId,
    handle: product?.handle ?? "",
    title: product?.title ?? "Untitled product",
    images: compactVisibilityImages(product),
    imageUrl,
    variants: [],
  };
}

function compactVisibilityProductPageReference(product: any) {
  const normalized = compactVisibilityProductReference(product);
  return {
    productId: normalized.productId,
    graphqlId: normalized.graphqlId,
    handle: normalized.handle,
    variants: normalized.variants,
    images: normalized.images,
    title: normalized.title,
  };
}

export function normalizeVisibilityProductForDisplayConfiguration(
  product: any,
) {
  return compactVisibilityProductReference(product);
}

export function normalizeVisibilityProductPageTarget(product: any) {
  return compactVisibilityProductPageReference(product);
}

function compactVisibilityCollectionReference(collection: any) {
  const graphqlId = getVisibilityResourceId(collection);
  return {
    id: graphqlId,
    collectionId: getVisibilityResourceNumericId(collection),
    graphqlId,
    handle: collection?.handle ?? "",
    title: collection?.title ?? "Untitled collection",
  };
}

function compactVisibilityCollectionPageReference(collection: any) {
  const normalized = compactVisibilityCollectionReference(collection);
  return {
    collectionId: normalized.collectionId,
    graphqlId: normalized.graphqlId,
    handle: normalized.handle,
    variants: [],
    images: [],
    title: normalized.title,
  };
}

export function normalizeVisibilityCollectionForDisplayConfiguration(
  collection: any,
) {
  return compactVisibilityCollectionReference(collection);
}

export function normalizeVisibilityCollectionPageTarget(collection: any) {
  return compactVisibilityCollectionPageReference(collection);
}

// Memoized Bundle Product Card component to prevent unnecessary re-renders
export const BundleProductCard = memo(
  ({
    bundleProduct,
    productImageUrl,
    productTitle,
    onSync,
    onSelect,
    onOpenProduct,
  }: BundleProductCardProps) => (
    <s-section>
      <s-stack direction="block" gap="small">
        <s-stack
          direction="inline"
          justifyContent="space-between"
          alignItems="center"
        >
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            Bundle Product
          </h3>
          <s-button variant="tertiary" tone="critical" onClick={onSync}>
            Sync Product
          </s-button>
        </s-stack>

        {bundleProduct ? (
          <s-stack direction="block" gap="small">
            <s-stack direction="inline" gap="small" alignItems="center">
              <img
                src={productImageUrl || "/bundle.png"}
                alt={productTitle || "Bundle Product"}
                style={{
                  width: 40,
                  height: 40,
                  objectFit: "cover",
                  borderRadius: 4,
                }}
              />
              <s-stack direction="inline" gap="small-100" alignItems="center">
                <s-button
                  variant="tertiary"
                  onClick={onOpenProduct}
                  disabled={!onOpenProduct}
                >
                  <s-icon type="view" />
                  {productTitle || bundleProduct.title || "Untitled Product"}
                </s-button>
                <s-button
                  variant="tertiary"
                  onClick={onSelect}
                  aria-label="Change bundle product"
                >
                  <s-icon type="clock" />
                </s-button>
              </s-stack>
            </s-stack>
          </s-stack>
        ) : (
          <div className={productPageBundleStyles.productSelectionPlaceholder}>
            <s-stack direction="block" gap="small-400" alignItems="center">
              <s-icon type="product" />
              <s-button variant="tertiary" onClick={onSelect}>
                Select Bundle Product
              </s-button>
            </s-stack>
          </div>
        )}
      </s-stack>
    </s-section>
  ),
);

BundleProductCard.displayName = "BundleProductCard";

// BundleStatusSection imported from _shared/bundle-configure/BundleStatusSection

export function QuestionHelpTooltip({
  tooltipKey,
}: {
  tooltipKey: HelpTooltipKey;
}) {
  const { t } = useTranslation();
  const tooltip = HELP_TOOLTIPS[tooltipKey];
  const title = t(`tooltips.${tooltipKey}.title`, "");
  const description = t(`tooltips.${tooltipKey}.description`);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    left: number;
    arrowLeft: number;
  } | null>(null);

  const showTooltip = () => {
    if (!wrapperRef.current) return;
    const width = Math.min(320, window.innerWidth - 32);
    const rect = wrapperRef.current.getBoundingClientRect();
    const left = Math.min(
      Math.max(rect.left + rect.width / 2 - width / 2, 16),
      window.innerWidth - width - 16,
    );
    setTooltipPos({
      top: rect.bottom + 10,
      left,
      arrowLeft: rect.left + rect.width / 2 - left,
    });
  };
  const hideTooltip = () => setTooltipPos(null);

  return (
    <span
      ref={wrapperRef}
      className={productPageBundleStyles.richHelp}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      <span className={productPageBundleStyles.richHelpTrigger}>
        <s-button
          variant="tertiary"
          icon="info"
          accessibilityLabel={title || description}
        />
      </span>
      <span
        className={`${productPageBundleStyles.richHelpCard} ${productPageBundleStyles.richHelpCardFloating}`}
        role="tooltip"
        style={
          tooltipPos
            ? ({
                position: "fixed",
                top: tooltipPos.top,
                left: tooltipPos.left,
                width: Math.min(320, window.innerWidth - 32),
                transform: "none",
                opacity: 1,
                visibility: "visible",
                pointerEvents: "auto",
                "--rich-help-arrow-left": `${tooltipPos.arrowLeft}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {tooltip.imageSrc && (
          <HelpTooltipImage
            src={tooltip.imageSrc}
            alt={title || tooltip.accessibilityLabel || description}
          />
        )}
        {title && (
          <span className={productPageBundleStyles.richHelpTitle}>{title}</span>
        )}
        <span className={productPageBundleStyles.richHelpDescription}>
          {description}
        </span>
      </span>
    </span>
  );
}

export function VisibilityBadge({ isOptimised }: { isOptimised: boolean }) {
  const { t } = useTranslation();
  const description = t(`tooltips.bundleVisibilityPending.description`);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{
    top: number;
    right: number;
  } | null>(null);

  const showTooltip = () => {
    if (wrapperRef.current) {
      const r = wrapperRef.current.getBoundingClientRect();
      setTooltipPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    }
  };
  const hideTooltip = () => setTooltipPos(null);

  return (
    <span
      ref={wrapperRef}
      className={
        isOptimised
          ? productPageBundleStyles.optimisedBadge
          : productPageBundleStyles.pendingBadge
      }
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      tabIndex={0}
      aria-label={`${isOptimised ? "Optimised" : "Pending"} — ${description}`}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      {isOptimised ? "Optimised" : "Pending"}
      <svg
        width="11"
        height="11"
        viewBox="0 0 13 13"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="6.5"
          cy="6.5"
          r="5.75"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line
          x1="6.5"
          y1="5.75"
          x2="6.5"
          y2="9.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="6.5" cy="4.25" r="0.75" fill="currentColor" />
      </svg>
      {tooltipPos && (
        <span
          className={productPageBundleStyles.pendingTooltipCard}
          style={{
            position: "fixed",
            top: tooltipPos.top,
            right: tooltipPos.right,
          }}
          role="tooltip"
        >
          {description}
        </span>
      )}
    </span>
  );
}
