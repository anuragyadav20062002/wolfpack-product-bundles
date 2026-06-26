import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeAddonTierAccordionIndex } from "../../../lib/addon-tier-accordion";
import {
  buildAddonDraftFromPersonalizationData,
  buildPersonalizationDataFromDraft,
} from "./addon-helpers";
import type { ConfigureBundleFlowDraft } from "./configure-flow-types";

export function useConfigureAddonState(flow: ConfigureBundleFlowDraft) {
  const { bundle, markAsDirty } = flow;
  const [addonDraft, setAddonDraft] = useState(() =>
    buildAddonDraftFromPersonalizationData((bundle as any).personalizationData),
  );
  const originalAddonDraftRef = useRef<any>(addonDraft);
  const [activeAddonTierIndex, setActiveAddonTierIndex] = useState<
    number | null
  >(0);
  const [addonSelectedProductsTierIndex, setAddonSelectedProductsTierIndex] =
    useState<number | null>(null);
  const [
    isAddonSelectedProductsModalOpen,
    setIsAddonSelectedProductsModalOpen,
  ] = useState(false);
  const updateAddonDraft = useCallback(
    (updates: Record<string, any>) => {
      setAddonDraft((current: any) => ({ ...current, ...updates }));
      markAsDirty();
    },
    [markAsDirty],
  );
  const addonTierCount =
    Array.isArray(addonDraft.addonTiers) ? addonDraft.addonTiers.length : 0;

  useEffect(() => {
    setActiveAddonTierIndex((currentIndex) => {
      return normalizeAddonTierAccordionIndex(currentIndex, addonTierCount);
    });
  }, [addonTierCount]);

  Object.assign(flow, {
    activeAddonTierIndex,
    addonDraft,
    addonSelectedProductsTierIndex,
    addonTierCount,
    buildAddonDraftFromPersonalizationData,
    buildPersonalizationDataFromDraft,
    isAddonSelectedProductsModalOpen,
    originalAddonDraftRef,
    setActiveAddonTierIndex,
    setAddonDraft,
    setAddonSelectedProductsTierIndex,
    setIsAddonSelectedProductsModalOpen,
    updateAddonDraft,
  });
}
