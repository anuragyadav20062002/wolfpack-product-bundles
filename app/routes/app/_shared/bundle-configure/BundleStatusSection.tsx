import { memo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const handleChange = (event: Event) => {
    const nextValue = (
      (event.currentTarget as HTMLSelectElement | null)?.value ||
      (event.target as HTMLSelectElement).value
    ) as BundleStatus;

    if (statusOptions.some((opt) => opt.value === nextValue)) {
      onChange(nextValue);
    }
  };

  useEffect(() => {
    if (selectRef.current) {
      (selectRef.current as any).value = status;
    }
  }, [status]);

  return (
    <s-stack direction="block" gap="small-100">
      <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
        {t("common.bundleStatus.title")}
      </h3>
      <s-select
        ref={selectRef}
        value={status}
        label={t("common.bundleStatus.title")}
        onChange={handleChange}
      >
        {statusOptions.map((opt) => (
          <s-option key={opt.value} value={opt.value}>
            {t(`common.bundleStatus.options.${opt.value}`)}
          </s-option>
        ))}
      </s-select>
    </s-stack>
  );
});

BundleStatusSection.displayName = "BundleStatusSection";

export { BundleStatusSection };
