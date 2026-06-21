import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";
import { FpbAddonFooterMessaging } from "./FreeGiftAddonFooterMessaging";
import { FpbAddonProductsCard } from "./FreeGiftAddonProductsCard";
import { FpbAddonReferenceStepCard } from "./FreeGiftAddonReferenceStepCard";

export function FreeGiftAddonsSection({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const { activeSection } = flow;

  if (activeSection !== "free_gift_addons") return null;

  return (
    <div data-tour-target="fpb-free-gift-addons">
      <s-stack direction="block" gap="small-100">
        <FpbAddonReferenceStepCard flow={flow} />
        <FpbAddonProductsCard flow={flow} />
        <FpbAddonFooterMessaging flow={flow} />
      </s-stack>
    </div>
  );
}
