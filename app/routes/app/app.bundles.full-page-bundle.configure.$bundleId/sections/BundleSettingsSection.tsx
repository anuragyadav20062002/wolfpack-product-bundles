import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";
import { FpbBundleCssSettings } from "./BundleSettingsCss";
import { FpbDefaultProductsSettings } from "./BundleSettingsDefaultProducts";
import { FpbQuantitySettings } from "./BundleSettingsQuantity";
import { FpbSellingPlanSettings } from "./BundleSettingsSellingPlan";
import { FpbSummaryTextSettings } from "./BundleSettingsSummaryText";
import { FpbBundleTemplateSettings } from "./BundleSettingsTemplate";
import { FpbTimelineSettings } from "./BundleSettingsTimeline";

export function BundleSettingsSection({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const { activeSection } = flow;

  if (activeSection !== "bundle_settings") return null;

  return (
    <div data-tour-target="fpb-bundle-settings">
      <s-stack direction="block" gap="base">
        <FpbDefaultProductsSettings flow={flow} />
        <FpbQuantitySettings flow={flow} />
        <FpbSummaryTextSettings flow={flow} />
        <FpbSellingPlanSettings flow={flow} />
        <FpbBundleTemplateSettings flow={flow} />
        <FpbTimelineSettings flow={flow} />
        <FpbBundleCssSettings flow={flow} />
      </s-stack>
    </div>
  );
}
