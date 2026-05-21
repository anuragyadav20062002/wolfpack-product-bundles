import { memo, useRef, useEffect } from "react";
import { BUNDLE_STATUS_OPTIONS } from "../../../../constants/bundle";
import type { BundleStatusSectionProps } from "../../../../types/bundle-configure";
import type { BundleStatus } from "../../../../constants/bundle";

const statusOptions = [...BUNDLE_STATUS_OPTIONS];

/**
 * Shared bundle status selector for FPB and PPB configure pages.
 * Uses the imperative ref pattern to keep the web component in sync.
 */
const BundleStatusSection = memo(({ status, onChange }: BundleStatusSectionProps) => {
  const selectRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (selectRef.current) {
      (selectRef.current as any).value = status;
    }
  }, [status]);

  return (
    <s-stack direction="block" gap="small-100">
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
        Bundle Status
      </h3>
      <s-select
        ref={selectRef}
        label="Bundle Status"
        onChange={(e: Event) => onChange((e.target as HTMLSelectElement).value as BundleStatus)}
      >
        {statusOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </s-select>
    </s-stack>
  );
});

BundleStatusSection.displayName = "BundleStatusSection";

export { BundleStatusSection };
