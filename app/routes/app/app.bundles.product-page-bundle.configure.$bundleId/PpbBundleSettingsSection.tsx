import { usePpbConfigureContext } from "./PpbConfigureContext";
import { PpbBundleSettingsControls } from "./PpbBundleSettingsControls";

export function PpbBundleSettingsSection() {
  const { activeSection } = usePpbConfigureContext();

  if (activeSection !== "bundle_settings") return null;
  return <PpbBundleSettingsControls />;
}
