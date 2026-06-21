import { useCallback } from "react";
import {
  createDefaultAddonDraftTier,
  normalizeAddonPickerProduct,
} from "./addon-helpers";
import type { ConfigureBundleFlowDraft } from "./configure-flow-types";

export function useConfigureAddonActionHandlers(
  flow: ConfigureBundleFlowDraft,
) {
  const openAddonSelectedProductsModal = useCallback(
    (tierIndex: number) => {
      flow.setAddonSelectedProductsTierIndex(tierIndex);
      flow.setIsAddonSelectedProductsModalOpen(true);
    },
    [flow],
  );
  const handleAddonSelectedProductRemove = useCallback(
    (tierIndex: number, productIndex: number) => {
      const addonTiers = Array.isArray(flow.addonDraft.addonTiers)
        ? flow.addonDraft.addonTiers
        : [createDefaultAddonDraftTier()];
      const updated = addonTiers.map((tier: any, index: number) => {
        if (index !== tierIndex) return tier;
        const selectedAddonProducts = Array.isArray(tier.selectedAddonProducts)
          ? tier.selectedAddonProducts
          : [];
        return {
          ...tier,
          selectedAddonProducts: selectedAddonProducts.filter(
            (_: any, selectedIndex: number) => selectedIndex !== productIndex,
          ),
        };
      });
      flow.updateAddonDraft({ addonTiers: updated });
    },
    [flow],
  );
  const handleAddonSelectedProductAdd = useCallback(
    async (
      tierIndex: number,
      options?: { reopenSelectedProductsModal?: boolean },
    ) => {
      if (options?.reopenSelectedProductsModal) {
        flow.setAddonSelectedProductsTierIndex(tierIndex);
        flow.setIsAddonSelectedProductsModalOpen(false);
        flow.hidePolarisModal(flow.addonSelectedProductsModalRef);
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      }
      const addonTiers = Array.isArray(flow.addonDraft.addonTiers)
        ? flow.addonDraft.addonTiers
        : [createDefaultAddonDraftTier()];
      const currentProducts = Array.isArray(
        addonTiers[tierIndex]?.selectedAddonProducts,
      )
        ? addonTiers[tierIndex].selectedAddonProducts
        : [];
      try {
        const picked = await (flow.shopify as any).resourcePicker({
          type: "product",
          multiple: true,
          selectionIds: currentProducts.map((product: any) => ({
            id: product.graphqlId || product.id,
          })),
        });
        const selection = Array.isArray(picked) ? picked : picked?.selection;
        if (!selection) return;
        const updated = addonTiers.map((tier: any, index: number) =>
          index === tierIndex
            ? {
                ...tier,
                selectedAddonProducts: selection.map((product: any) =>
                  normalizeAddonPickerProduct(product),
                ),
              }
            : tier,
        );
        flow.updateAddonDraft({ addonTiers: updated });
      } finally {
        if (options?.reopenSelectedProductsModal) {
          flow.setAddonSelectedProductsTierIndex(tierIndex);
          flow.setIsAddonSelectedProductsModalOpen(true);
        }
      }
    },
    [flow],
  );
  const handleDisableAddonStepConfirm = useCallback(() => {
    flow.setIsDisableAddonStepModalOpen(false);
    flow.updateAddonDraft({ isPersonalizationEnabled: false });
  }, [flow]);

  return {
    createDefaultAddonDraftTier,
    handleAddonSelectedProductAdd,
    handleAddonSelectedProductRemove,
    handleDisableAddonStepConfirm,
    normalizeAddonPickerProduct,
    openAddonSelectedProductsModal,
  };
}
