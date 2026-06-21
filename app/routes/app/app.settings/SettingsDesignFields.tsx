import type { SettingsField } from "../../../lib/admin-configuration-surfaces";
import styles from "../../../styles/routes/admin-configuration-surfaces.module.css";

export function SettingsCardIcon({ icon }: { icon: string }) {
  return (
    <span className={styles.settingsCardIcon} aria-hidden="true">
      <s-icon type={icon as any} size="base"></s-icon>
    </span>
  );
}

export function DesignFields({
  title,
  fields,
  values,
  onFieldChange,
}: {
  title?: string;
  fields: SettingsField[];
  values: Record<string, string>;
  onFieldChange: (label: string, value: string) => void;
}) {
  const defaultGroup = title ?? "";
  const groupedFields = fields.reduce<Array<{ title: string; fields: SettingsField[] }>>((groups, field) => {
    const groupTitle = field.group ?? defaultGroup;
    const existing = groups.find((group) => group.title === groupTitle);
    if (existing) {
      existing.fields.push(field);
    } else {
      groups.push({ title: groupTitle, fields: [field] });
    }
    return groups;
  }, []);
  const colorPickerValue = (value: string, fallback: string) => {
    const hex = /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
    if (/^#[0-9a-f]{6}$/i.test(hex)) {
      return hex;
    }
    const shortHex = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(hex);
    return shortHex ? `#${shortHex[1]}${shortHex[1]}${shortHex[2]}${shortHex[2]}${shortHex[3]}${shortHex[3]}` : "#000000";
  };

  return (
    <div className={styles.designFieldStack}>
      {groupedFields.map((group) => {
        const guideUrl = group.fields.find((field) => field.guideUrl)?.guideUrl;

        return (
          <section key={group.title} className={styles.designFieldGroup}>
            {group.title ? (
              <div className={styles.designFieldPanelHeader}>
                <h2>{group.title}</h2>
                {guideUrl ? (
                  <a href={guideUrl} target="_blank" rel="noreferrer" className={styles.designGuideLink}>
                    Show Color Guide
                  </a>
                ) : null}
              </div>
            ) : null}
            {group.fields.map((field) => {
              const fieldKey = field.key ?? field.label;
              const value = values[fieldKey] ?? field.value ?? "";
              const colorValue = colorPickerValue(value, field.value || "#000000");

              return (
                <label key={`${group.title}:${field.label}`} className={styles.designFieldRow}>
                  <span className={styles.designFieldCopy}>
                    <span className={styles.designFieldLabel}>{field.label}</span>
                    {field.description && <span className={styles.designFieldHelp}>{field.description}</span>}
                  </span>
                  {field.kind === "color" ? (
                    <span className={styles.designColorControl}>
                      <input
                        type="color"
                        value={colorValue}
                        aria-label={`${field.label} color`}
                        onChange={(event) => onFieldChange(fieldKey, event.currentTarget.value)}
                      />
                      <input
                        value={value}
                        aria-label={`${field.label} Hex Code`}
                        onChange={(event) => onFieldChange(fieldKey, event.currentTarget.value)}
                      />
                    </span>
                  ) : field.kind === "select" ? (
                    <select
                      className={styles.designInput}
                      value={value || field.options?.[0] || ""}
                      onChange={(event) => onFieldChange(fieldKey, event.currentTarget.value)}
                    >
                      {(field.options?.length ? field.options : [field.value ?? ""]).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={styles.designInput}
                      value={value}
                      onChange={(event) => onFieldChange(fieldKey, event.currentTarget.value)}
                    />
                  )}
                </label>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}

export function BundlePreviewModal({
  isOpen,
  bundles,
  onClose,
}: {
  isOpen: boolean;
  bundles: Array<{ id: string; name: string; type: string; viewUrl: string | null }>;
  onClose: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.settingsModalBackdrop} role="presentation">
      <section className={styles.bundlePreviewModal} role="dialog" aria-modal="true" aria-labelledby="bundle-preview-title">
        <div className={styles.bundlePreviewHeader}>
          <h2 id="bundle-preview-title">Bundle Preview</h2>
          <button type="button" className={styles.settingsModalDismiss} aria-label="Dismiss Bundle Preview" onClick={onClose}>
            X
          </button>
        </div>
        <div className={styles.bundlePreviewGridHeader}>
          <span>Bundle Name</span>
          <span>Type</span>
          <span aria-hidden="true" />
        </div>
        <div className={styles.bundlePreviewRows}>
          {bundles.length === 0 ? (
            <p className={styles.emptyLanguageState}>No storefront-ready bundles are available for preview.</p>
          ) : bundles.map((bundle) => (
            <div key={bundle.id} className={styles.bundlePreviewRow}>
              <span className={styles.bundlePreviewName}>{bundle.name}</span>
              <span>{bundle.type}</span>
              <button
                type="button"
                className={styles.bundlePreviewViewButton}
                disabled={!bundle.viewUrl}
                onClick={() => {
                  if (bundle.viewUrl) {
                    window.open(bundle.viewUrl, "_blank", "noopener,noreferrer");
                  }
                }}
              >
                View
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function getControlTabIcon(title: string) {
  if (title === "CSS & Scripts") {
    return "note";
  }
  if (title === "Integrations") {
    return "plus";
  }
  if (title === "Advanced") {
    return "filter";
  }
  return "info";
}

export function getDesignIconKey(title: string) {
  if (title === "Brand Colors") {
    return "edit";
  }
  if (title === "Typography") {
    return "note";
  }
  if (title === "Corners") {
    return "edit";
  }
  if (title === "Images & GIFs") {
    return "upload";
  }
  if (title === "Product Card") {
    return "product";
  }
  if (title === "Bundle Cart") {
    return "product";
  }
  if (title === "Upsell") {
    return "plus";
  }
  return "info";
}
