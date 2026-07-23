import type { CommonConfigureLiveCard } from "../_shared/bundle-configure/CommonConfigureSidebar";

export function buildPpbLiveCard({
  isPreparingPlacementTemplates,
  handlePlaceWidget,
}: {
  isPreparingPlacementTemplates: boolean;
  handlePlaceWidget: () => void;
}): CommonConfigureLiveCard {
  return {
    title: "Take your bundle live",
    label: "Place on theme",
    actionLabel: "Place Widget",
    loading: isPreparingPlacementTemplates,
    disabled: isPreparingPlacementTemplates,
    onAction: handlePlaceWidget,
  };
}
