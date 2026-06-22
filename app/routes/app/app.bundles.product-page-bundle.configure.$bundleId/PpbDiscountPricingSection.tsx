import { usePpbConfigureContext } from "./PpbConfigureContext";
import { PpbDiscountDisplayOptions } from "./PpbDiscountDisplayOptions";
import { PpbDiscountRulesPanel } from "./PpbDiscountRulesPanel";

export function PpbDiscountPricingSection() {
  const { activeSection } = usePpbConfigureContext();

  if (activeSection !== "discount_pricing") {
    return null;
  }

  return (
    <div data-tour-target="ppb-discount-pricing">
      <s-stack direction="block" gap="base">
        <PpbDiscountRulesPanel />
        <PpbDiscountDisplayOptions />
      </s-stack>
    </div>
  );
}
