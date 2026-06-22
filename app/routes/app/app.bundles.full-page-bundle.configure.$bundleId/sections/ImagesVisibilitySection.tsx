import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";
import { FpbBundleVisibilityPanel } from "./BundleVisibilityPanel";
import { FpbImagesGifsPanel } from "./ImagesGifsPanel";

export function ImagesVisibilitySection({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const { activeSection, fullPageBundleStyles } = flow;

  if (
    activeSection !== "images_gifs" &&
    activeSection !== "bundle_visibility"
  ) {
    return null;
  }

  return (
    <div data-tour-target="fpb-design-settings">
      <s-stack direction="block" gap="base">
        <FpbBundleVisibilityPanel flow={flow} />
        <FpbImagesGifsPanel flow={flow} />
      </s-stack>
    </div>
  );
}
