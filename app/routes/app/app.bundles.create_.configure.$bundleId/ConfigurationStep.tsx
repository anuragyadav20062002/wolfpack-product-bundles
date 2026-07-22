import { BUNDLE_STATUS_OPTIONS, STEP_CONDITION_OPERATOR_OPTIONS, STEP_CONDITION_TYPE_OPTIONS } from "../../../constants/bundle";
import { FilePicker } from "../../../components/shared/FilePicker";
import { StepSummary } from "./StepSummary";
import type { ConditionDef, WizardStepState } from "./types";
import styles from "./wizard-configure.module.css";

type Props = { ctx: any };

export function ConfigurationStep({ ctx }: Props) {
  const { steps, currentIdx, navigateTo, handleRemoveStep, handleAddStep, slideKey, slideDir, currentStep, showIconPicker, updateCurrent, setShowIconPicker, setLocaleModalOpen, categoryActiveTabs, setCategoryActiveTabs, updateStepCategory, deleteCategory, pickCategoryProducts, pickCategoryCollections, addCategory, updateRule, removeRule, addRule, statusSelectRef, setBundleStatus, bundleStatus, selectedProductCount, selectedCollectionCount, rulesCount, filtersCount, searchBarEnabled, customFieldsCount, isAnyWizardSaveInFlight, handleBack, handleNext } = ctx;
  return (

  <>
    {/* Step chip navigation */}
    <div className={styles.stepNav}>
      {steps.map((s: WizardStepState, i: number) => (
        <button
          key={s.tempId}
          className={
            i === currentIdx ? styles.stepChipActive : styles.stepChip
          }
          onClick={() => navigateTo(i)}
        >
          Step {i + 1}
          {steps.length > 1 && i === currentIdx && (
            <span
              style={{ marginLeft: 6, opacity: 0.6, fontSize: 11 }}
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveStep(i);
              }}
              title="Remove this step"
            >
              ✕
            </span>
          )}
        </button>
      ))}
      <button className={styles.addStepBtn} onClick={handleAddStep}>
        + Add Step
      </button>
    </div>

    <div className={styles.layout}>
      {/* LEFT — Config cards */}
      <div className={styles.leftCol}>
        <div
          key={slideKey}
          className={
            slideDir
              ? styles[
                  `slide${slideDir.charAt(0).toUpperCase()}${slideDir.slice(1)}`
                ]
              : ""
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Step Configuration */}
            <div
              className={styles.card}
              data-tour-target="wizard-step-config"
            >
              <div className={styles.cardHeader}>
                <s-heading>Step Configuration</s-heading>
                <s-button
                  variant="secondary"
                  icon="globe"
                  onClick={() => setLocaleModalOpen(true)}
                >
                  Multi Language
                </s-button>
              </div>

              <div className={styles.stepConfigRow}>
                <div className={styles.iconColumn}>
                  <div className={styles.iconBox}>
                    {currentStep.iconUrl ? (
                      <img
                        src={currentStep.iconUrl}
                        alt="Step icon"
                        className={styles.iconImg}
                      />
                    ) : (
                      <div className={styles.iconPlaceholder}>
                        <svg
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#d1d5db"
                          strokeWidth="1.5"
                        >
                          <path d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m16 5l-8 4-8-4" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className={styles.filePickerHidden}>
                    {showIconPicker && (
                      <FilePicker
                        value={currentStep.iconUrl}
                        onChange={(url: string | null) => {
                          updateCurrent("iconUrl", url);
                          setShowIconPicker(false);
                        }}
                        label="Step icon"
                      />
                    )}
                  </div>

                  <s-button
                    variant="secondary"
                    icon="upload"
                    onClick={() => setShowIconPicker((v: boolean) => !v)}
                  >
                    {showIconPicker ? "Close picker" : "Upload Icon"}
                  </s-button>
                  <s-text color="subdued">512×512 px · PNG/SVG</s-text>
                </div>

                <div className={styles.fieldsColumn}>
                  <s-text-field
                    label="Step Name"
                    placeholder="Eg:- Add product"
                    value={currentStep.name}
                    onInput={(e) =>
                      updateCurrent(
                        "name",
                        (e.target as HTMLInputElement).value
                      )
                    }
                    autocomplete="off"
                  />
                  <div>
                    <s-text-field
                      label="Product Page Title"
                      placeholder="Eg:- Customized T-shirt Bundle for you"
                      value={currentStep.pageTitle}
                      onInput={(e) =>
                        updateCurrent(
                          "pageTitle",
                          (e.target as HTMLInputElement).value
                        )
                      }
                      autocomplete="off"
                    />
                    <s-text color="subdued">
                      This text will appear as the page header right after the navigation bar.
                    </s-text>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories accordion */}
            <div
              className={styles.card}
              data-tour-target="wizard-select-product"
            >
              <div className={styles.cardHeader} style={{ marginBottom: 4 }}>
                <s-heading>Select Product</s-heading>
              </div>
              <s-text color="subdued">
                Add categories and select products or collections for each.
              </s-text>

              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                {currentStep.StepCategory.map((cat: WizardStepState["StepCategory"][number]) => {
                  const tabKey = `${currentStep.tempId}__${cat.id}`;
                  const activeTab = categoryActiveTabs[tabKey] ?? 0;
                  return (
                    <div key={cat.id} className={styles.categoryAccordion}>
                      <div className={styles.categoryAccordionHeader}>
                        <span style={{ color: "#8c9196", cursor: "grab", fontSize: 14 }}>⠿</span>
                        <input
                          className={styles.categoryNameInput}
                          value={cat.name}
                          placeholder="Category name"
                          onChange={(e) => updateStepCategory(cat.id, "name", e.currentTarget.value)}
                        />
                        <div style={{ display: "flex", gap: 4 }}>
                          {currentStep.StepCategory.length > 1 && (
                            <s-button
                              variant="tertiary"
                              icon="delete"
                              tone="critical"
                              accessibilityLabel={`Delete ${cat.name || "category"}`}
                              onClick={() => deleteCategory(cat.id)}
                            />
                          )}
                        </div>
                      </div>

                      <div style={{ padding: "8px 10px" }}>
                        <div className={styles.tabRow} style={{ marginBottom: 8 }}>
                          <button
                            className={activeTab === 0 ? styles.tabActive : styles.tab}
                            onClick={() => setCategoryActiveTabs((prev: Record<string, number>) => ({ ...prev, [tabKey]: 0 }))}
                          >
                            Products
                            {cat.products.length > 0 && (
                              <span className={styles.tabBadge}>{cat.products.length}</span>
                            )}
                          </button>
                          <button
                            className={activeTab === 1 ? styles.tabActive : styles.tab}
                            onClick={() => setCategoryActiveTabs((prev: Record<string, number>) => ({ ...prev, [tabKey]: 1 }))}
                          >
                            Collections
                            {cat.collections.length > 0 && (
                              <span className={styles.tabBadge}>{cat.collections.length}</span>
                            )}
                          </button>
                        </div>

                        {activeTab === 0 && (
                          <div>
                            <s-button variant="primary" onClick={() => pickCategoryProducts(cat.id)}>
                              {cat.products.length > 0 ? "Edit Products" : "Add Products"}
                            </s-button>
                            {cat.products.length > 0 && (
                              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                                {cat.products.map((p: any) => (
                                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                                    {p.imageUrl && <img src={p.imageUrl} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />}
                                    <s-text>{p.title}</s-text>
                                    <s-button variant="tertiary" icon="delete" tone="critical" accessibilityLabel={`Remove ${p.title || "product"}`} onClick={() => updateStepCategory(cat.id, "products", cat.products.filter((x: any) => x.id !== p.id))} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === 1 && (
                          <div>
                            <s-button variant="primary" onClick={() => pickCategoryCollections(cat.id)}>
                              {cat.collections.length > 0 ? "Edit Collections" : "Add Collections"}
                            </s-button>
                            {cat.collections.length > 0 && (
                              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                                {cat.collections.map((c: any) => (
                                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                                    <s-text>{c.title}</s-text>
                                    <s-button variant="tertiary" icon="delete" tone="critical" accessibilityLabel={`Remove ${c.title || "collection"}`} onClick={() => updateStepCategory(cat.id, "collections", cat.collections.filter((x: any) => x.id !== c.id))} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 8 }}>
                <s-button variant="tertiary" icon="plus" onClick={addCategory}>
                  Add Category
                </s-button>
              </div>
            </div>

            {/* Rules */}
            <div className={styles.card} data-tour-target="wizard-rules">
              <div
                className={styles.cardHeader}
                style={{ marginBottom: 4 }}
              >
                <s-heading>Rules</s-heading>
              </div>
              <s-text color="subdued">
                Define conditions for product selection and quantity limits.
              </s-text>

              {currentStep.conditions.length === 0 ? (
                <div className={styles.emptyState}>
                  No rules defined yet
                </div>
              ) : (
                <div className={styles.rulesList}>
                  {currentStep.conditions.map((rule: ConditionDef) => (
                    <div key={rule.id} className={styles.ruleRow}>
                      <s-select
                        label="Type"
                        onChange={(e) =>
                          updateRule(
                            rule.id,
                            "conditionType",
                            (e.target as HTMLSelectElement).value
                          )
                        }
                      >
                        {[...STEP_CONDITION_TYPE_OPTIONS].map((opt) => (
                          <s-option
                            key={opt.value}
                            value={opt.value}
                            selected={
                              rule.conditionType === opt.value ||
                              undefined
                            }
                          >
                            {opt.label}
                          </s-option>
                        ))}
                      </s-select>

                      <s-select
                        label="Operator"
                        onChange={(e) =>
                          updateRule(
                            rule.id,
                            "conditionOperator",
                            (e.target as HTMLSelectElement).value
                          )
                        }
                      >
                        {[...STEP_CONDITION_OPERATOR_OPTIONS].map(
                          (opt) => (
                            <s-option
                              key={opt.value}
                              value={opt.value}
                              selected={
                                rule.conditionOperator === opt.value ||
                                undefined
                              }
                            >
                              {opt.label}
                            </s-option>
                          )
                        )}
                      </s-select>

                      <s-number-field
                        label="Value"
                        value={rule.conditionValue}
                        min={0}
                        onInput={(e) =>
                          updateRule(
                            rule.id,
                            "conditionValue",
                            (e.target as HTMLInputElement).value
                          )
                        }
                      />

                      <s-button
                        icon="delete"
                        variant="tertiary"
                        tone="critical"
                        accessibilityLabel="Remove rule"
                        onClick={() => removeRule(rule.id)}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.addRuleWrap}>
                <s-button variant="secondary" icon="plus" onClick={addRule}>
                  Add Rule
                </s-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT — Config sidebar */}
      <div className={styles.rightCol}>
        <div
          className={styles.sideCard}
          data-tour-target="wizard-bundle-status"
        >
          <s-heading>Bundle Status</s-heading>
          <s-select
            ref={statusSelectRef}
            label="Bundle status"
            labelAccessibilityVisibility="exclusive"
            onChange={(e) =>
              setBundleStatus(
                (e.target as HTMLSelectElement).value
              )
            }
          >
            {BUNDLE_STATUS_OPTIONS.map((opt) => (
              <s-option
                key={opt.value}
                value={opt.value}
                selected={bundleStatus === opt.value || undefined}
              >
                {opt.label}
              </s-option>
            ))}
          </s-select>
        </div>

        <StepSummary
          selectedCount={selectedProductCount + selectedCollectionCount}
          rulesCount={rulesCount}
          filtersCount={filtersCount}
          searchBarEnabled={searchBarEnabled}
          customFieldsCount={customFieldsCount}
        />

        <s-banner tone="info" heading="PRO TIP">
          Bundles with 3+ products see 24% higher conversion rates when
          search filters are enabled.
        </s-banner>

        <div className={styles.wizardFooter}>
          <s-button variant="secondary" onClick={handleBack}>
            Back
          </s-button>
          <s-button
            variant="primary"
            disabled={isAnyWizardSaveInFlight || undefined}
            onClick={handleNext}
          >
            Next
          </s-button>
        </div>
      </div>
    </div>
  </>
  );
}
