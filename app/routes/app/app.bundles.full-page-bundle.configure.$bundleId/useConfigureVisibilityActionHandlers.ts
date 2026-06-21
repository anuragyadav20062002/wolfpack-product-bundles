import { useCallback } from "react";
import {
  buildVisibilitySelectionIds,
  getVisibilityPickerSelection,
  normalizeVisibilityCollectionForDisplayConfiguration,
  normalizeVisibilityCollectionPageTarget,
  normalizeVisibilityProductForDisplayConfiguration,
  normalizeVisibilityProductPageTarget,
} from "./visibility-helpers";
import type { ConfigureBundleFlowDraft } from "./configure-flow-types";

export function useConfigureVisibilityActionHandlers(
  flow: ConfigureBundleFlowDraft,
) {
  const openVisibilityProductPicker = useCallback(
    async (target: "widget" | "embed") => {
      const currentProducts =
        target === "widget" ? flow.upsellWidgetSelectedProducts : [];
      const picked = await (flow.shopify as any).resourcePicker({
        type: "product",
        multiple: true,
        action: "select",
        selectionIds: buildVisibilitySelectionIds(currentProducts),
      });
      const selection = getVisibilityPickerSelection(picked);
      if (!selection) return;
      const selectedProducts = selection.map((product: any) =>
        normalizeVisibilityProductForDisplayConfiguration(product),
      );
      const pageTargets = selectedProducts.map((product: any) =>
        normalizeVisibilityProductPageTarget(product),
      );
      flow.setUpsellWidgetSelectedProducts(selectedProducts);
      flow.setUpsellWidgetSpecificProductPages(pageTargets);
      flow.markAsDirty();
    },
    [flow],
  );
  const openVisibilityCollectionPicker = useCallback(
    async (target: "widget" | "embed") => {
      const currentCollections =
        target === "widget" ? flow.upsellWidgetCollectionsSelectedData : [];
      const picked = await (flow.shopify as any).resourcePicker({
        type: "collection",
        multiple: true,
        action: "select",
        selectionIds: buildVisibilitySelectionIds(currentCollections),
      });
      const selection = getVisibilityPickerSelection(picked);
      if (!selection) return;
      const collectionsSelectedData = selection.map((collection: any) =>
        normalizeVisibilityCollectionForDisplayConfiguration(collection),
      );
      const pageTargets = collectionsSelectedData.map((collection: any) =>
        normalizeVisibilityCollectionPageTarget(collection),
      );
      flow.setUpsellWidgetCollectionsSelectedData(collectionsSelectedData);
      flow.setUpsellWidgetSpecificCollectionPages(pageTargets);
      flow.markAsDirty();
    },
    [flow],
  );
  const removeVisibilityProductTarget = useCallback(
    (target: "widget" | "embed", indexToRemove: number) => {
      if (target === "widget") {
        flow.setUpsellWidgetSelectedProducts((prev: unknown[]) =>
          prev.filter((_, index) => index !== indexToRemove),
        );
        flow.setUpsellWidgetSpecificProductPages((prev: unknown[]) =>
          prev.filter((_, index) => index !== indexToRemove),
        );
      }
      flow.markAsDirty();
    },
    [flow],
  );
  const removeVisibilityCollectionTarget = useCallback(
    (target: "widget" | "embed", indexToRemove: number) => {
      if (target === "widget") {
        flow.setUpsellWidgetCollectionsSelectedData((prev: unknown[]) =>
          prev.filter((_, index) => index !== indexToRemove),
        );
        flow.setUpsellWidgetSpecificCollectionPages((prev: unknown[]) =>
          prev.filter((_, index) => index !== indexToRemove),
        );
      }
      flow.markAsDirty();
    },
    [flow],
  );

  return {
    buildVisibilitySelectionIds,
    getVisibilityPickerSelection,
    normalizeVisibilityCollectionForDisplayConfiguration,
    normalizeVisibilityCollectionPageTarget,
    normalizeVisibilityProductForDisplayConfiguration,
    normalizeVisibilityProductPageTarget,
    openVisibilityCollectionPicker,
    openVisibilityProductPicker,
    removeVisibilityCollectionTarget,
    removeVisibilityProductTarget,
  };
}
