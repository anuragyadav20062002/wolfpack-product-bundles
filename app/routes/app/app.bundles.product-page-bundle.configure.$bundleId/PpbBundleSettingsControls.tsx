import { PpbBundleStatusCard } from "./PpbBundleStatusCard";
import { PpbBundleBannerSettings } from "./PpbBundleSettingsControls.banner";
import { PpbBundleLevelCssSettings } from "./PpbBundleSettingsControls.css";
import { PpbCartDiscountDisplaySettings } from "./PpbBundleSettingsControls.discount";
import { PpbDefaultProductsSettings } from "./PpbBundleSettingsControls.defaultProducts";
import { PpbQuantityAndSellingPlanSettings } from "./PpbBundleSettingsControls.quantity";

export function PpbBundleSettingsControls() {
  return (
    <div data-tour-target="ppb-bundle-status">
      <s-stack direction="block" gap="base">
        <PpbDefaultProductsSettings />
        <PpbQuantityAndSellingPlanSettings />
        <PpbCartDiscountDisplaySettings />
        <PpbBundleBannerSettings />
        <PpbBundleLevelCssSettings />
        <PpbBundleStatusCard />
      </s-stack>
    </div>
  );
}
