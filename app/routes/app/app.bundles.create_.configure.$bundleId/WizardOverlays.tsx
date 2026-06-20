import { EnablePreviewModal } from "../../../components/EnablePreviewModal";
import { BundleReadinessOverlay } from "../../../components/bundle-configure/BundleReadinessOverlay";
import { CUSTOM_FIELD_TYPE_OPTIONS } from "./wizard-constants";
import type { CustomFieldDef } from "./types";
import styles from "./wizard-configure.module.css";

type Props = { ctx: any };

export function WizardOverlays({ ctx }: Props) {
  const { enablePreviewGate, localeModalRef, currentIdx, currentStep, shopLocales, localeSelectRef, setSelectedLocale, selectedLocale, getTranslation, setTranslation, setLocaleModalOpen, filtersDrawerOpen, setFiltersDrawerOpen, steps, filtersDrawerStepIdx, setFiltersDrawerStepIdx, updateFilter, removeFilter, addFilter, customFieldsModalOpen, setCustomFieldsModalOpen, customFields, updateCustomField, removeCustomField, addCustomField, readinessItems, bundle, readinessOpen, setReadinessOpen } = ctx;
  return (
    <>
      <EnablePreviewModal {...enablePreviewGate.modalProps} />

      {/* Multi-Language Modal */}
      <s-modal
        ref={localeModalRef}
        heading="Multi Language"
      >
        <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
          Translating: <strong>Step {currentIdx + 1}</strong> —{" "}
          {currentStep.name || "unnamed step"}
        </p>

        {shopLocales.filter((l) => !l.primary).length === 0 ? (
          <p style={{ color: "#9ca3af", fontSize: 14 }}>
            No additional locales published in your store. Enable more
            languages in Shopify Settings → Languages.
          </p>
        ) : (
          <>
            <div>
              <p className={styles.modalSectionTitle}>Language</p>
              <s-select
                ref={localeSelectRef}
                label="Language"
                labelAccessibilityVisibility="exclusive"
                onChange={(e) =>
                  setSelectedLocale(
                    (e.target as HTMLSelectElement).value
                  )
                }
              >
                {shopLocales
                  .filter((l) => !l.primary)
                  .map((l) => (
                    <s-option
                      key={l.locale}
                      value={l.locale}
                      selected={
                        selectedLocale === l.locale || undefined
                      }
                    >
                      {l.name}
                    </s-option>
                  ))}
              </s-select>
            </div>

            {selectedLocale && (
              <div>
                <p className={styles.modalSectionTitle}>
                  Step Name ({selectedLocale})
                </p>
                <p className={styles.modalHint}>
                  Leave blank to fall back to the default English name.
                </p>
                <s-text-field
                  label={`Step name translation for ${selectedLocale}`}
                  labelAccessibilityVisibility="exclusive"
                  placeholder={
                    currentStep.name || "Step name in English"
                  }
                  value={getTranslation(selectedLocale)}
                  onInput={(e) =>
                    setTranslation(
                      selectedLocale,
                      (e.target as HTMLInputElement).value
                    )
                  }
                  autocomplete="off"
                />
              </div>
            )}
          </>
        )}

        <s-button
          slot="primary-action"
          variant="primary"
          onClick={() => setLocaleModalOpen(false)}
        >
          Save
        </s-button>
        <s-button
          slot="secondary-actions"
          variant="secondary"
          onClick={() => setLocaleModalOpen(false)}
        >
          Cancel
        </s-button>
      </s-modal>

      {/* Filters Drawer */}
      {filtersDrawerOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setFiltersDrawerOpen(false)}
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Filters</h2>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setFiltersDrawerOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalSectionTitle}>Select Step</p>
              <div className={styles.stepNav} style={{ marginBottom: 16 }}>
                {steps.map((s, i) => (
                  <button
                    key={s.tempId}
                    className={
                      i === filtersDrawerStepIdx
                        ? styles.stepChipActive
                        : styles.stepChip
                    }
                    onClick={() => setFiltersDrawerStepIdx(i)}
                  >
                    Step {i + 1}
                    {s.filters.length > 0 && (
                      <span
                        className={styles.tabBadge}
                        style={{ marginLeft: 6 }}
                      >
                        {s.filters.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <p className={styles.modalSectionTitle}>
                Filters for Step {filtersDrawerStepIdx + 1}
              </p>
              {(steps[filtersDrawerStepIdx]?.collections ?? []).length === 0 ? (
                <div
                  className={styles.emptyState}
                  style={{ marginBottom: 12 }}
                >
                  Add collections to this step first to configure category filters.
                </div>
              ) : (steps[filtersDrawerStepIdx]?.filters ?? []).length === 0 ? (
                <div
                  className={styles.emptyState}
                  style={{ marginBottom: 12 }}
                >
                  No filters defined
                </div>
              ) : (
                <div className={styles.rulesList}>
                  {(steps[filtersDrawerStepIdx]?.filters ?? []).map(
                    (filter) => (
                      <div key={filter.id} className={styles.filterRow}>
                        <s-text-field
                          label="Tab label"
                          value={filter.label}
                          placeholder="e.g. Shirts"
                          autocomplete="off"
                          onInput={(e) =>
                            updateFilter(filtersDrawerStepIdx, filter.id, {
                              label: (e.target as HTMLInputElement).value,
                            })
                          }
                        />
                        <s-select
                          label="Collection"
                          value={filter.collectionHandle}
                          onChange={(e) =>
                            updateFilter(filtersDrawerStepIdx, filter.id, {
                              collectionHandle: (e.target as HTMLSelectElement)
                                .value,
                            })
                          }
                        >
                          {(steps[filtersDrawerStepIdx]?.collections ?? []).map(
                            (collection: any) => {
                              const value = collection.handle || collection.id;
                              return (
                                <s-option
                                  key={value}
                                  value={value}
                                  selected={
                                    filter.collectionHandle === value || undefined
                                  }
                                >
                                  {collection.title || collection.handle || collection.id}
                                </s-option>
                              );
                            }
                          )}
                        </s-select>
                        <s-button
                          icon="delete"
                          variant="tertiary"
                          tone="critical"
                          accessibilityLabel="Remove filter"
                          onClick={() =>
                            removeFilter(filtersDrawerStepIdx, filter.id)
                          }
                        />
                      </div>
                    )
                  )}
                </div>
              )}
              <s-button
                variant="secondary"
                icon="plus"
                disabled={
                  (steps[filtersDrawerStepIdx]?.collections ?? []).length === 0 ||
                  undefined
                }
                onClick={() => addFilter(filtersDrawerStepIdx)}
              >
                Add Filter
              </s-button>
            </div>
            <div className={styles.modalFooter}>
              <s-button
                variant="secondary"
                onClick={() => setFiltersDrawerOpen(false)}
              >
                Cancel
              </s-button>
              <s-button
                variant="primary"
                onClick={() => setFiltersDrawerOpen(false)}
              >
                Done
              </s-button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Fields Modal */}
      {customFieldsModalOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setCustomFieldsModalOpen(false)}
        >
          <div
            className={styles.modal}
            style={{ width: "min(600px, 100%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Custom Fields</h2>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setCustomFieldsModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: "0 0 4px", fontSize: 13, color: "#6b7280" }}>
                Custom fields are shown to customers during bundle completion
                and saved as Shopify order line item properties.
              </p>
              {customFields.length === 0 ? (
                <div className={styles.emptyState}>
                  No custom fields defined yet
                </div>
              ) : (
                <div className={styles.rulesList}>
                  {customFields.map((cf) => (
                    <div key={cf.id} className={styles.customFieldRow}>
                      <div className={styles.customFieldRowTop}>
                        <s-text-field
                          label="Field Label"
                          value={cf.label}
                          placeholder="e.g. Gift message, Engraving text"
                          autocomplete="off"
                          onInput={(e) =>
                            updateCustomField(cf.id, {
                              label: (e.target as HTMLInputElement).value,
                            })
                          }
                        />
                        <s-select
                          label="Type"
                          onChange={(e) =>
                            updateCustomField(cf.id, {
                              fieldType: (e.target as HTMLSelectElement)
                                .value as CustomFieldDef["fieldType"],
                            })
                          }
                        >
                          {CUSTOM_FIELD_TYPE_OPTIONS.map((opt) => (
                            <s-option
                              key={opt.value}
                              value={opt.value}
                              selected={
                                cf.fieldType === opt.value || undefined
                              }
                            >
                              {opt.label}
                            </s-option>
                          ))}
                        </s-select>
                        <s-button
                          icon="delete"
                          variant="tertiary"
                          tone="critical"
                          accessibilityLabel="Remove field"
                          onClick={() => removeCustomField(cf.id)}
                        />
                      </div>
                      <s-checkbox
                        label="Required"
                        checked={cf.required || undefined}
                        onChange={(e) =>
                          updateCustomField(cf.id, {
                            required: (e.target as HTMLInputElement).checked,
                          })
                        }
                      />
                      {cf.fieldType === "select" && (
                        <div style={{ marginTop: 8 }}>
                          <s-text color="subdued">
                            Options (one per line)
                          </s-text>
                          <s-text-area
                            label="Dropdown options"
                            labelAccessibilityVisibility="exclusive"
                            value={cf.options.join("\n")}
                            placeholder={"Option 1\nOption 2\nOption 3"}
                            onInput={(e) =>
                              updateCustomField(cf.id, {
                                options: (
                                  e.target as HTMLTextAreaElement
                                ).value
                                  .split("\n")
                                  .map((o) => o.trim())
                                  .filter(Boolean),
                              })
                            }
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <s-button
                variant="secondary"
                icon="plus"
                onClick={addCustomField}
              >
                Add Field
              </s-button>
            </div>
            <div className={styles.modalFooter}>
              <s-button
                variant="secondary"
                onClick={() => setCustomFieldsModalOpen(false)}
              >
                Cancel
              </s-button>
              <s-button
                variant="primary"
                onClick={() => setCustomFieldsModalOpen(false)}
              >
                Save
              </s-button>
            </div>
          </div>
        </div>
      )}

      {/* Readiness Score Widget */}
      <BundleReadinessOverlay
        items={readinessItems}
        bundleId={bundle.id}
        open={readinessOpen}
        onOpenChange={setReadinessOpen}
        variant="compact"
      />

    </>
  );
}
