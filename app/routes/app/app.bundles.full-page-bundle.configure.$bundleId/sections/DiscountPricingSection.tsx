import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";
import { FpbDiscountDisplayOptions } from "./DiscountDisplayOptions";
import { FpbDiscountRulesSection } from "./DiscountPricingRules";

export function DiscountPricingSection({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const { activeSection } = flow;

  if (activeSection !== "discount_pricing") return null;

  return (
    <div data-tour-target="fpb-discount-pricing">
      <s-stack direction="block" gap="base">
        <FpbDiscountRulesSection flow={flow} />
        <FpbDiscountDisplayOptions flow={flow} />
      </s-stack>
    </div>
  );
}
