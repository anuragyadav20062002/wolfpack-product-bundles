import { usePpbConfigureContext } from "./PpbConfigureContext";
import { PpbStepSetupSection } from "./PpbStepSetupSection";
import { PpbDiscountPricingSection } from "./PpbDiscountPricingSection";
import { PpbBundleVisibilitySection } from "./PpbBundleVisibilitySection";
import { PpbBundleWidgetSection } from "./PpbBundleWidgetSection";
import { PpbBundleEmbedSection } from "./PpbBundleEmbedSection";
import { PpbImagesGifsSection } from "./PpbImagesGifsSection";
import { PpbBundleSettingsSection } from "./PpbBundleSettingsSection";
import { PpbSubscriptionsSection } from "./PpbSubscriptionsSection";
import { PpbFreeGiftAddonsSection } from "./PpbFreeGiftAddonsSection";

export function PpbMainSections() {
  const { loaderData, productPageBundleStyles } = usePpbConfigureContext();

  return (
    <>
      <div className={productPageBundleStyles.mainColumn}>
        <PpbStepSetupSection /> <PpbDiscountPricingSection />
        <PpbBundleVisibilitySection /> <PpbBundleWidgetSection />
        <PpbBundleEmbedSection /> <PpbImagesGifsSection />
        <PpbBundleSettingsSection /> <PpbSubscriptionsSection />
        <PpbFreeGiftAddonsSection />
      </div>
    </>
  );
}
