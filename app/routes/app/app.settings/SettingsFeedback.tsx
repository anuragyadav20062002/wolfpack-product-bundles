import { useEffect } from "react";
import type { SettingsField } from "../../../lib/admin-configuration-surfaces";
import styles from "../../../styles/routes/admin-configuration-surfaces.module.css";

export function SettingsContextualSaveBar({ isOpen, onDiscard, onSave }: { isOpen: boolean; onDiscard: () => void; onSave: () => void }) {
  useEffect(() => {
    const shopify = (window as typeof window & {
      shopify?: { saveBar?: { show: (id: string) => void; hide: (id: string) => void } };
    }).shopify;

    if (!shopify?.saveBar) {
      return;
    }

    if (isOpen) {
      shopify.saveBar.show("settings-contextual-save-bar");
    } else {
      shopify.saveBar.hide("settings-contextual-save-bar");
    }
  }, [isOpen]);

  return (
    <ui-save-bar id="settings-contextual-save-bar">
      <button type="button" onClick={onDiscard}>
        Discard
      </button>
      <button type="button" variant="primary" onClick={onSave}>
        Save
      </button>
    </ui-save-bar>
  );
}

export function SettingsHelpModal({
  article,
  onClose,
}: {
  article: "inventory" | null;
  onClose: () => void;
}) {
  if (!article) {
    return null;
  }

  return (
    <div className={styles.settingsModalBackdrop} role="presentation">
      <section className={styles.settingsModal} role="dialog" aria-modal="true" aria-labelledby="settings-help-title">
        <div className={styles.ebSectionHeader}>
          <h2 id="settings-help-title">Product-level inventory tracking</h2>
          <button type="button" className={styles.settingsModalDismiss} aria-label="Dismiss help modal" onClick={onClose}>
            X
          </button>
        </div>
        <div className={styles.settingsHelpBody}>
          <p>Enable the inventory tracking toggle in Additional Configurations to apply product-level inventory tracking globally to all bundles.</p>
          <ul>
            <li>Each child product should have Shopify Track Quantity enabled.</li>
            <li>Products with zero inventory are not shown in the bundle.</li>
            <li>Digital products should use inventory 0 or below so they are recognized correctly.</li>
            <li>If Track Quantity is disabled, the product may still appear but cannot be added to cart when out of stock.</li>
            <li>If out-of-stock selling is enabled and inventory is above 0, digital-product detection can be restricted.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}

export function SettingsToast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  if (!message) {
    return null;
  }

  return (
    <div className={styles.settingsToast} role="status" aria-live="polite">
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss save message">
        x
      </button>
    </div>
  );
}

export function DetailGroup({
  title,
  description,
  fields,
}: {
  title: string;
  description?: string;
  fields: SettingsField[];
}) {
  const fieldGroups = fields.reduce<Array<{ title: string; fields: SettingsField[] }>>((groups, field) => {
    const groupTitle = field.group ?? "";
    const existingGroup = groups.find((group) => group.title === groupTitle);
    if (existingGroup) {
      existingGroup.fields.push(field);
      return groups;
    }
    groups.push({ title: groupTitle, fields: [field] });
    return groups;
  }, []);

  return (
    <section className={styles.detailGroup}>
      <div>
        <h3 className={styles.detailTitle}>{title}</h3>
        {description && <p className={styles.detailDescription}>{description}</p>}
      </div>
      {fieldGroups.map((group) => (
        <div key={`${title}-${group.title || "default"}`} className={styles.fieldGroup}>
          {group.title && <h4 className={styles.fieldGroupTitle}>{group.title}</h4>}
          <div className={styles.detailGrid}>
            {group.fields.map((field) => (
              <div key={`${title}-${field.label}`} className={styles.fieldCard}>
                <div className={styles.fieldTopLine}>
                  <span className={styles.fieldLabel}>{field.label}</span>
                  {field.state && <span className={styles.statePill}>{field.state}</span>}
                </div>
                {field.value !== undefined && (
                  <div className={styles.fieldValue}>{field.value || "Blank"}</div>
                )}
                {field.description && <p className={styles.fieldDescription}>{field.description}</p>}
                {field.options && (
                  <div className={styles.optionRail}>
                    {field.options.map((option) => (
                      <span key={option} className={styles.optionChip}>{option}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

