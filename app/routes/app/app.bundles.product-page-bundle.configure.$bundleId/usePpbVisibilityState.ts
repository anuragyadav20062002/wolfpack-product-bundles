import { useRef, useState } from "react";
import {
  asVisibilityArray,
  getVisibilityDisplayTarget,
} from "./ConfigureBundleFlow.helpers";

export function usePpbVisibilityState({
  bundle,
  textOverrides,
}: {
  bundle: any;
  textOverrides: Record<string, string>;
}) {
  const savedBundleUpsellConfig = ((bundle as any).bundleUpsellConfig ??
    null) as any;
  const savedWidgetConfiguration = savedBundleUpsellConfig?.widgetConfiguration;
  const savedUpsellConfiguration = savedBundleUpsellConfig?.upsellConfiguration;
  const savedWidgetDisplayConfiguration =
    savedWidgetConfiguration?.displayConfiguration;
  const savedEmbedDisplayConfiguration =
    savedUpsellConfiguration?.displayConfiguration;
  const [upsellWidgetEnabled, setUpsellWidgetEnabled] = useState<boolean>(
    savedWidgetConfiguration?.isEnabled ??
      (bundle as any).upsellWidgetEnabled ??
      false,
  );
  const [upsellWidgetDisplayMode, setUpsellWidgetDisplayMode] =
    useState<string>((bundle as any).upsellWidgetDisplayMode ?? "block");
  const [upsellWidgetDisplayOn, setUpsellWidgetDisplayOn] = useState<string>(
    (bundle as any).upsellWidgetDisplayOn ??
      getVisibilityDisplayTarget(savedWidgetDisplayConfiguration, "all"),
  );
  const [upsellWidgetTitle, setUpsellWidgetTitle] = useState<string>(
    savedWidgetConfiguration?.title ?? "Bundle & Save",
  );
  const [upsellWidgetDescription, setUpsellWidgetDescription] =
    useState<string>(savedWidgetConfiguration?.description ?? "");
  const [upsellWidgetButtonText, setUpsellWidgetButtonText] = useState<string>(
    savedWidgetConfiguration?.buttonText ?? "Buy With Bundle",
  );
  const [upsellWidgetImageUrl, setUpsellWidgetImageUrl] = useState<string>(
    savedWidgetConfiguration?.imageUrl ?? "",
  );
  const [upsellWidgetSelectedProducts, setUpsellWidgetSelectedProducts] =
    useState<unknown[]>(
      asVisibilityArray(savedWidgetDisplayConfiguration?.selectedProducts),
    );
  const [
    upsellWidgetSpecificProductPages,
    setUpsellWidgetSpecificProductPages,
  ] = useState<unknown[]>(
    asVisibilityArray(
      savedWidgetDisplayConfiguration?.showOnSpecificProductPages,
    ),
  );
  const [
    upsellWidgetCollectionsSelectedData,
    setUpsellWidgetCollectionsSelectedData,
  ] = useState<unknown[]>(
    asVisibilityArray(savedWidgetDisplayConfiguration?.collectionsSelectedData),
  );
  const [
    upsellWidgetSpecificCollectionPages,
    setUpsellWidgetSpecificCollectionPages,
  ] = useState<unknown[]>(
    asVisibilityArray(
      savedWidgetDisplayConfiguration?.showOnSpecificCollectionPages,
    ),
  );
  const [autoSelectBrowsedProduct, setAutoSelectBrowsedProduct] =
    useState<boolean>(
      savedWidgetConfiguration?.useLinkProductAsDefaultProduct ??
        (bundle as any).autoSelectBrowsedProduct ??
        false,
    );
  const [bundleEmbedEnabled, setBundleEmbedEnabled] = useState<boolean>(
    savedUpsellConfiguration?.isEnabled ??
      textOverrides.bundleEmbedEnabled === "true",
  );
  const [bundleEmbedTitle, setBundleEmbedTitle] = useState<string>(
    savedUpsellConfiguration?.title ??
      textOverrides.embedTitle ??
      "Build Your Bundle & Save More",
  );
  const [bundleEmbedSubTitle, setBundleEmbedSubTitle] = useState<string>(
    savedUpsellConfiguration?.subTitle ?? textOverrides.embedSubTitle ?? "",
  );
  const [bundleEmbedDisplayOn, setBundleEmbedDisplayOn] = useState<string>(
    textOverrides.embedDisplayOn ??
      getVisibilityDisplayTarget(
        savedEmbedDisplayConfiguration,
        "all_products",
      ),
  );
  const [bundleEmbedAddBrowsedProduct, setBundleEmbedAddBrowsedProduct] =
    useState<boolean>(
      savedUpsellConfiguration?.useLinkProductAsDefaultProduct ??
        textOverrides.embedAddBrowsedProduct === "true",
    );
  const [bundleEmbedSelectedProducts, setBundleEmbedSelectedProducts] =
    useState<unknown[]>(
      asVisibilityArray(savedEmbedDisplayConfiguration?.selectedProducts),
    );
  const [bundleEmbedSpecificProductPages, setBundleEmbedSpecificProductPages] =
    useState<unknown[]>(
      asVisibilityArray(
        savedEmbedDisplayConfiguration?.showOnSpecificProductPages,
      ),
    );
  const [
    bundleEmbedCollectionsSelectedData,
    setBundleEmbedCollectionsSelectedData,
  ] = useState<unknown[]>(
    asVisibilityArray(savedEmbedDisplayConfiguration?.collectionsSelectedData),
  );
  const [
    bundleEmbedSpecificCollectionPages,
    setBundleEmbedSpecificCollectionPages,
  ] = useState<unknown[]>(
    asVisibilityArray(
      savedEmbedDisplayConfiguration?.showOnSpecificCollectionPages,
    ),
  );
  const originalUpsellWidgetEnabledRef = useRef<boolean>(
    savedWidgetConfiguration?.isEnabled ??
      (bundle as any).upsellWidgetEnabled ??
      false,
  );
  const originalUpsellWidgetDisplayModeRef = useRef<string>(
    (bundle as any).upsellWidgetDisplayMode ?? "block",
  );
  const originalUpsellWidgetDisplayOnRef = useRef<string>(
    (bundle as any).upsellWidgetDisplayOn ??
      getVisibilityDisplayTarget(savedWidgetDisplayConfiguration, "all"),
  );
  const originalUpsellWidgetTitleRef = useRef<string>(
    savedWidgetConfiguration?.title ?? "Bundle & Save",
  );
  const originalUpsellWidgetDescriptionRef = useRef<string>(
    savedWidgetConfiguration?.description ?? "",
  );
  const originalUpsellWidgetButtonTextRef = useRef<string>(
    savedWidgetConfiguration?.buttonText ?? "Buy With Bundle",
  );
  const originalUpsellWidgetImageUrlRef = useRef<string>(
    savedWidgetConfiguration?.imageUrl ?? "",
  );
  const originalAutoSelectBrowsedProductRef = useRef<boolean>(
    savedWidgetConfiguration?.useLinkProductAsDefaultProduct ??
      (bundle as any).autoSelectBrowsedProduct ??
      false,
  );
  const originalBundleEmbedEnabledRef = useRef<boolean>(
    savedUpsellConfiguration?.isEnabled ??
      (bundle as any).textOverrides?.bundleEmbedEnabled === "true",
  );
  const originalBundleEmbedTitleRef = useRef<string>(
    savedUpsellConfiguration?.title ??
      (bundle as any).textOverrides?.embedTitle ??
      "Build Your Bundle & Save More",
  );
  const originalBundleEmbedSubTitleRef = useRef<string>(
    savedUpsellConfiguration?.subTitle ??
      (bundle as any).textOverrides?.embedSubTitle ??
      "",
  );
  const originalBundleEmbedDisplayOnRef = useRef<string>(
    (bundle as any).textOverrides?.embedDisplayOn ??
      getVisibilityDisplayTarget(
        savedEmbedDisplayConfiguration,
        "all_products",
      ),
  );
  const originalBundleEmbedAddBrowsedProductRef = useRef<boolean>(
    savedUpsellConfiguration?.useLinkProductAsDefaultProduct ??
      (bundle as any).textOverrides?.embedAddBrowsedProduct === "true",
  );

  return {
    savedBundleUpsellConfig,
    savedWidgetConfiguration,
    savedUpsellConfiguration,
    savedWidgetDisplayConfiguration,
    savedEmbedDisplayConfiguration,
    upsellWidgetEnabled,
    setUpsellWidgetEnabled,
    upsellWidgetDisplayMode,
    setUpsellWidgetDisplayMode,
    upsellWidgetDisplayOn,
    setUpsellWidgetDisplayOn,
    upsellWidgetTitle,
    setUpsellWidgetTitle,
    upsellWidgetDescription,
    setUpsellWidgetDescription,
    upsellWidgetButtonText,
    setUpsellWidgetButtonText,
    upsellWidgetImageUrl,
    setUpsellWidgetImageUrl,
    upsellWidgetSelectedProducts,
    setUpsellWidgetSelectedProducts,
    upsellWidgetSpecificProductPages,
    setUpsellWidgetSpecificProductPages,
    upsellWidgetCollectionsSelectedData,
    setUpsellWidgetCollectionsSelectedData,
    upsellWidgetSpecificCollectionPages,
    setUpsellWidgetSpecificCollectionPages,
    autoSelectBrowsedProduct,
    setAutoSelectBrowsedProduct,
    bundleEmbedEnabled,
    setBundleEmbedEnabled,
    bundleEmbedTitle,
    setBundleEmbedTitle,
    bundleEmbedSubTitle,
    setBundleEmbedSubTitle,
    bundleEmbedDisplayOn,
    setBundleEmbedDisplayOn,
    bundleEmbedAddBrowsedProduct,
    setBundleEmbedAddBrowsedProduct,
    bundleEmbedSelectedProducts,
    setBundleEmbedSelectedProducts,
    bundleEmbedSpecificProductPages,
    setBundleEmbedSpecificProductPages,
    bundleEmbedCollectionsSelectedData,
    setBundleEmbedCollectionsSelectedData,
    bundleEmbedSpecificCollectionPages,
    setBundleEmbedSpecificCollectionPages,
    originalUpsellWidgetEnabledRef,
    originalUpsellWidgetDisplayModeRef,
    originalUpsellWidgetDisplayOnRef,
    originalUpsellWidgetTitleRef,
    originalUpsellWidgetDescriptionRef,
    originalUpsellWidgetButtonTextRef,
    originalUpsellWidgetImageUrlRef,
    originalAutoSelectBrowsedProductRef,
    originalBundleEmbedEnabledRef,
    originalBundleEmbedTitleRef,
    originalBundleEmbedSubTitleRef,
    originalBundleEmbedDisplayOnRef,
    originalBundleEmbedAddBrowsedProductRef,
  };
}
