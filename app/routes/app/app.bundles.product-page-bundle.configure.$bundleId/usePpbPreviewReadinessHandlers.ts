import { useCallback, useMemo, useState } from "react";
import { AppLogger } from "../../../lib/logger";
import productPageBundleStyles from "../../../styles/routes/product-page-bundle-configure.module.css";
import { useEnablePreviewGate } from "../../../hooks/useEnablePreviewGate";
import { pickPpbPreviewUrl } from "../../../lib/ppb-preview-url";
import type { BundleReadinessItem } from "../../../components/bundle-configure/BundleReadinessOverlay";
import type { TourStep } from "../../../components/bundle-configure/tourSteps";

export function usePpbPreviewReadinessHandlers({
  base,
  visibility,
  templateState,
}: {
  base: any;
  visibility: any;
  templateState: any;
}) {
  const [isPreviewBundleLoading, setIsPreviewBundleLoading] = useState(false);
  const enablePreviewGate = useEnablePreviewGate({
    appEmbedEnabled: base.appEmbedEnabled,
    themeEditorUrl: base.themeEditorUrl,
    onSilentBlock: () =>
      base.shopify.toast.show("Theme editor is unavailable for this shop.", {
        isError: true,
      }),
    sessionKey: base.bundle.id,
    autoShowOnMount:
      base.loaderData.configureMode === "edit" &&
      base.isBundleVisibilityPending,
    onSetupVisibility: () => base.setActiveSection("bundle_visibility"),
  });
  const handlePreviewBundle = useCallback(() => {
    if (base.isDirty) {
      base.shopify.toast.show(
        "Please save your changes before previewing the bundle",
        { isError: true, duration: 4000 },
      );
      return false;
    }
    const result = enablePreviewGate.requestPreview(async () => {
      setIsPreviewBundleLoading(true);
      try {
        const bundleStatusForPreview = String(
          (base.bundle as any).status ?? "",
        ).toLowerCase();
        let productUrl = pickPpbPreviewUrl({
          appEmbedEnabled: base.appEmbedEnabled,
          bundleStatus: bundleStatusForPreview,
          productHandle: base.bundle.shopifyProductHandle,
          bundleProduct: base.bundleProduct,
          shop: base.shop,
        });
        if (!productUrl && base.bundleProduct?.id) {
          const productId = base.bundleProduct.id.includes(
            "gid://shopify/Product/",
          )
            ? base.bundleProduct.id.split("/").pop()
            : base.bundleProduct.id;
          const shopDomain = base.shop.includes(".myshopify.com")
            ? base.shop.replace(".myshopify.com", "")
            : base.shop.split(".")[0];
          productUrl = `https://admin.shopify.com/store/${shopDomain}/products/${productId}`;
        }
        if (!productUrl) {
          AppLogger.error("Bundle product data:", {}, base.bundleProduct);
          base.shopify.toast.show(
            "Unable to determine bundle product URL. Please check bundle product configuration.",
            {
              isError: true,
              duration: 5000,
            },
          );
          return true;
        }
        const isStorefrontUrl = !productUrl.includes("/admin.shopify.com/");
        const previewWindow = window.open(
          "about:blank",
          "_blank",
          "noopener,noreferrer",
        );
        if (isStorefrontUrl && base.bundleProduct?.id) {
          try {
            const formData = new FormData();
            formData.append("intent", "assignProductTemplate");
            formData.append("productId", base.bundleProduct.id);
            formData.append(
              "templateSuffix",
              (base.formState.templateName || "").trim(),
            );
            await fetch(window.location.href, { method: "POST", body: formData });
          } catch (err) {
            AppLogger.error(
              "Failed to sync product templateSuffix before preview",
              {},
              err,
            );
          }
        }
        if (previewWindow && !previewWindow.closed) {
          previewWindow.location.href = productUrl;
        } else {
          window.open(productUrl, "_blank", "noopener,noreferrer");
        }
        const isPreviewUrl =
          base.bundleProduct &&
          productUrl === base.bundleProduct.onlineStorePreviewUrl;
        const message = isPreviewUrl
          ? "Bundle product preview opened in new tab"
          : "Bundle product opened in new tab";
        base.shopify.toast.show(message, { isError: false });
        return true;
      } finally {
        window.setTimeout(() => setIsPreviewBundleLoading(false), 500);
      }
    });
    return result instanceof Promise ? result : result === true;
  }, [base, enablePreviewGate]);
  const readinessItems = useMemo<BundleReadinessItem[]>(() => {
    const hasProducts =
      base.stepsState.steps.reduce((totalProducts: number, step: any) => {
        const legacyProducts = Array.isArray(step.StepProduct)
          ? step.StepProduct.length
          : 0;
        const categoryProductCount = Array.isArray((step as any).StepCategory)
          ? ((step as any).StepCategory as any[]).reduce(
              (count: number, category: any) =>
                count +
                (Array.isArray(category?.products)
                  ? category.products.length
                  : 0),
              0,
            )
          : 0;
        return totalProducts + legacyProducts + categoryProductCount;
      }, 0) >= 3;
    const widgetPlaced = visibility.upsellWidgetEnabled;
    const parentProductActive =
      String(
        base.productStatus || base.loadedBundleProduct?.status || "",
      ).toLowerCase() === "active";
    return [
      {
        key: "embed",
        label: "App Embed Enabled",
        description: "Needed for your bundle to show up on store",
        points: 15,
        done: base.appEmbedEnabled,
      },
      {
        key: "products",
        label: "Minimum 3 Products Added",
        description: "Add more products to build a better bundle",
        points: 20,
        done: hasProducts,
      },
      {
        key: "discount",
        label: "Set Up Discount",
        description: "Bundles with offers tend to sell better",
        points: 15,
        done: base.pricingState.discountEnabled,
      },
      {
        key: "preview",
        label: "Preview Bundle",
        description: "Check your bundle looks and works right",
        points: 10,
        done: templateState.hasPreview,
      },
      {
        key: "widget",
        label: "Place Bundle Widget",
        description: "Place the bundle widget on your product page",
        points: 25,
        done: widgetPlaced,
      },
      {
        key: "product_active",
        label: "Set Parent Product to Active",
        description: "Unlisted bundles won't show in search",
        points: 15,
        done: parentProductActive,
      },
    ];
  }, [
    base.appEmbedEnabled,
    base.loadedBundleProduct?.status,
    base.pricingState.discountEnabled,
    base.productStatus,
    base.stepsState.steps,
    templateState.hasPreview,
    visibility.upsellWidgetEnabled,
  ]);
  const readinessScore = readinessItems.reduce(
    (sum, item) => sum + (item.done ? item.points : 0),
    0,
  );
  const readinessClassName =
    readinessScore >= 80
      ? productPageBundleStyles.readinessButtonHigh
      : readinessScore >= 40
        ? productPageBundleStyles.readinessButtonMedium
        : productPageBundleStyles.readinessButtonLow;
  const handleSectionChange = useCallback(
    (section: string) => {
      if (base.isDirty) {
        base.shopify.toast.show(
          "Please save or discard your changes before switching sections",
          { isError: true, duration: 4000 },
        );
        return;
      }
      base.setActiveSection(section);
    },
    [base],
  );
  const openProductInAdmin = useCallback(
    (productId: string) => {
      const numericProductId = productId.startsWith("gid://")
        ? (productId.split("/").pop() ?? productId)
        : productId;
      const productGid = productId.startsWith("gid://")
        ? productId
        : `gid://shopify/Product/${productId}`;
      const storeHandle = base.shop?.replace(".myshopify.com", "");
      const adminProductUrl = `https://admin.shopify.com/store/${storeHandle}/products/${numericProductId}`;
      const openFallback = () => {
        try {
          base.shopify.navigate(adminProductUrl);
        } catch (error) {
          AppLogger.warn(
            "Falling back to a new tab for Admin product navigation",
            { productId },
            error as any,
          );
          window.open(adminProductUrl, "_blank");
        }
        base.refreshParentProductStatusFromShopify();
      };
      const intentsApi = (base.shopify as any).intents;
      if (typeof intentsApi?.invoke === "function") {
        try {
          const intentResult = intentsApi.invoke("edit:shopify/Product", {
            type: "shopify/Product",
            value: productGid,
          });
          base.refreshParentProductStatusFromShopify();
          if (typeof intentResult?.catch === "function") {
            void intentResult.catch((error: unknown) => {
              AppLogger.warn(
                "Falling back after Product editor intent failed",
                { productId },
                error as any,
              );
              openFallback();
            });
          }
          return;
        } catch (error) {
          AppLogger.warn(
            "Falling back after Product editor intent failed",
            { productId },
            error as any,
          );
        }
      }
      openFallback();
    },
    [base],
  );
  const handleBackClick = useCallback(() => {
    if (base.isDirty && !base.forceNavigation) {
      base.shopify.toast.show(
        "Save or discard your changes before moving to another section.",
        { isError: true, duration: 5000 },
      );
      void (base.shopify as any).saveBar?.leaveConfirmation?.();
      return;
    }
    base.navigate("/app/dashboard");
  }, [base]);
  const handleReadinessItemClick = useCallback(
    (key: string) => {
      templateState.setReadinessOpen(false);
      switch (key) {
        case "embed":
          if (base.themeEditorUrl) window.open(base.themeEditorUrl, "_blank");
          break;
        case "products":
          handleSectionChange("step_setup");
          break;
        case "discount":
          handleSectionChange("discount_pricing");
          break;
        case "preview":
          void handlePreviewBundle();
          localStorage.setItem(`wpb_preview_${base.bundle.id}`, "1");
          templateState.setHasPreview(true);
          break;
        case "widget":
          handleSectionChange("bundle_visibility");
          break;
        case "product_active": {
          const productId =
            base.bundleProduct?.legacyResourceId ||
            base.bundleProduct?.id?.split("/").pop() ||
            (base.bundle as any).shopifyProductId?.split("/").pop();
          if (productId) {
            openProductInAdmin(productId);
          }
          break;
        }
        default:
          break;
      }
    },
    [
      base,
      handlePreviewBundle,
      handleSectionChange,
      openProductInAdmin,
      templateState,
    ],
  );
  const handleGuidedTourStepChange = useCallback(
    (step: TourStep) => {
      if (step.sectionId) {
        base.setActiveSection(step.sectionId);
      }
      templateState.setReadinessOpen(
        step.targetSection === "fpb-readiness-score",
      );
    },
    [base, templateState],
  );
  const handleAddNewStep = useCallback(() => {
    base.stepsState.addStep();
    templateState.setSlideDir("forward");
    templateState.setSlideKey((prev: number) => prev + 1);
    templateState.setActiveTabIndex(base.stepsState.steps.length);
  }, [base, templateState]);

  return {
    enablePreviewGate,
    handlePreviewBundle,
    isPreviewBundleLoading,
    readinessItems,
    readinessScore,
    readinessClassName,
    handleSectionChange,
    openProductInAdmin,
    handleBackClick,
    handleReadinessItemClick,
    handleGuidedTourStepChange,
    handleAddNewStep,
  };
}
