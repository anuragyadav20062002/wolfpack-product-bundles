import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbBundleStatusCard() {
  const { BundleStatusSection, formState } = usePpbConfigureContext();

  return (
    <s-section>
      <BundleStatusSection
        status={formState.bundleStatus}
        onChange={formState.setBundleStatus}
      />
    </s-section>
  );
}
