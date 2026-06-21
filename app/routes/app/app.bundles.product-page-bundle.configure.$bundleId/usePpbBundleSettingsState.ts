import { useMemo, useRef, useState } from "react";
import {
  normalizeDefaultProductsData,
  type DefaultProductsData,
} from "../../../lib/bundle-config/default-products";

export type IndividualSellingPlanShowFor = "ALL_PRODUCTS" | "OOS_PRODUCTS";

export function usePpbBundleSettingsState({ bundle }: { bundle: any }) {
  const [preSelectedProductVariantId, setPreSelectedProductVariantId] =
    useState<string>((bundle as any).preSelectedProductVariantId ?? "");
  const initialValidateQuantityPerProduct =
    ((bundle as any).validateQuantityPerProduct as {
      isEnabled?: boolean;
      allowedQuantity?: number;
    } | null) ?? null;
  const [quantityValidationEnabled, setQuantityValidationEnabled] =
    useState<boolean>(initialValidateQuantityPerProduct?.isEnabled === true);
  const [maxQtyPerProduct, setMaxQtyPerProduct] = useState<string>(
    (
      initialValidateQuantityPerProduct?.allowedQuantity ??
      (bundle as any).maxQtyPerProduct ??
      1
    ).toString(),
  );
  const [variantSelectorEnabled, setVariantSelectorEnabled] = useState<boolean>(
    (bundle as any).variantSelectorEnabled ?? true,
  );
  const [showTextOnAddButton, setShowTextOnAddButton] = useState<boolean>(
    (bundle as any).showTextOnAddButton ?? false,
  );
  const [bundleCartTitle, setBundleCartTitle] = useState<string>(
    (bundle as any).bundleCartTitle ?? "",
  );
  const [bundleCartSubtitle, setBundleCartSubtitle] = useState<string>(
    (bundle as any).bundleCartSubtitle ?? "",
  );
  const [bundleBannerDesktopUrl, setBundleBannerDesktopUrl] = useState<string>(
    (bundle as any).bundleBannerDesktopUrl ?? "",
  );
  const [bundleBannerMobileUrl, setBundleBannerMobileUrl] = useState<string>(
    (bundle as any).bundleBannerMobileUrl ?? "",
  );
  const [bundleLevelCss, setBundleLevelCss] = useState<string>(
    (bundle as any).bundleLevelCss ?? "",
  );
  const [bundleLevelCssExpanded, setBundleLevelCssExpanded] = useState(false);
  const initialDefaultProductsData = useMemo(
    () => normalizeDefaultProductsData((bundle as any).defaultProductsData),
    [bundle],
  );
  const [defaultProductsData, setDefaultProductsData] =
    useState<DefaultProductsData>(initialDefaultProductsData);
  const originalDefaultProductsDataRef = useRef<DefaultProductsData>(
    initialDefaultProductsData,
  );
  const [individualSellingPlanEnabled, setIndividualSellingPlanEnabled] =
    useState<boolean>(
      (
        (bundle as any).individualSellingPlanSelection as {
          isEnabled?: boolean;
        } | null
      )?.isEnabled === true,
    );
  const [individualSellingPlanShowFor, setIndividualSellingPlanShowFor] =
    useState<IndividualSellingPlanShowFor>(
      (
        (bundle as any).individualSellingPlanSelection as {
          showFor?: unknown;
        } | null
      )?.showFor === "OOS_PRODUCTS"
        ? "OOS_PRODUCTS"
        : "ALL_PRODUCTS",
    );

  return {
    preSelectedProductVariantId,
    setPreSelectedProductVariantId,
    initialValidateQuantityPerProduct,
    quantityValidationEnabled,
    setQuantityValidationEnabled,
    maxQtyPerProduct,
    setMaxQtyPerProduct,
    variantSelectorEnabled,
    setVariantSelectorEnabled,
    showTextOnAddButton,
    setShowTextOnAddButton,
    bundleCartTitle,
    setBundleCartTitle,
    bundleCartSubtitle,
    setBundleCartSubtitle,
    bundleBannerDesktopUrl,
    setBundleBannerDesktopUrl,
    bundleBannerMobileUrl,
    setBundleBannerMobileUrl,
    bundleLevelCss,
    setBundleLevelCss,
    bundleLevelCssExpanded,
    setBundleLevelCssExpanded,
    initialDefaultProductsData,
    defaultProductsData,
    setDefaultProductsData,
    originalDefaultProductsDataRef,
    individualSellingPlanEnabled,
    setIndividualSellingPlanEnabled,
    individualSellingPlanShowFor,
    setIndividualSellingPlanShowFor,
  };
}
