import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbStepFlowCard() {
  const {
    activeTabIndex,
    cloneStep,
    deleteStep,
    handleAddNewStep,
    markAsDirty,
    navigateToStep,
    openStepMultiLanguageModal,
    productPageBundleStyles,
    QuestionHelpTooltip,
    slideDir,
    slideKey,
    stepsState,
  } = usePpbConfigureContext();

  return (
    <div
      className={`${productPageBundleStyles.card} ${productPageBundleStyles.stepFlowCard}`}
    >
      <s-stack direction="block" gap="small">
        <div className={productPageBundleStyles.stepFlowTitleRow}>
          <span className={productPageBundleStyles.headingWithHelp}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>
              Step Flow
            </h3>
            <QuestionHelpTooltip tooltipKey="stepFlow" />
          </span>
          <button
            type="button"
            className={productPageBundleStyles.linkButton}
            onClick={() => window.open("https://wolfpackapps.com", "_blank")}
          >
            How to setup?
          </button>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
          Create steps for your multi-step bundle here. Select product options
          for each step below
        </p>
      </s-stack>
      <div className={productPageBundleStyles.stepNav}>
        {stepsState.steps.map((step, i) => (
          <button
            key={step.id}
            className={
              activeTabIndex === i
                ? productPageBundleStyles.stepChipActive
                : productPageBundleStyles.stepChip
            }
            onClick={() => navigateToStep(i)}
          >
            <span className={productPageBundleStyles.stepChipNumber}>
              {i + 1}
            </span>
            <span className={productPageBundleStyles.stepChipLabel}>
              {step.name || `Step ${i + 1}`}
            </span>
            <span className={productPageBundleStyles.stepChipChevron}>›</span>
          </button>
        ))}
        <button
          className={productPageBundleStyles.addStepBtn}
          onClick={handleAddNewStep}
        >
          <span aria-hidden="true">+</span> <span>Add Step</span>
        </button>
      </div>
      {stepsState.steps.map(
        (step, index) =>
          activeTabIndex === index && (
            <div
              key={`${step.id}-${slideKey}`}
              style={{ paddingTop: "16px" }}
              className={
                slideDir === "forward"
                  ? productPageBundleStyles.slideForward
                  : slideDir === "backward"
                    ? productPageBundleStyles.slideBackward
                    : ""
              }
            >
              <div className={productPageBundleStyles.stepSetupHeader}>
                <div className={productPageBundleStyles.stepSetupTitleGroup}>
                  <h3 className={productPageBundleStyles.stepSetupTitle}>
                    Step Setup
                  </h3>
                  <s-switch
                    accessibilityLabel="Enable step"
                    checked={step.enabled !== false || undefined}
                    onChange={(e) => {
                      stepsState.updateStepField(
                        step.id,
                        "enabled",
                        (e.target as HTMLInputElement).checked,
                      );
                      markAsDirty();
                    }}
                  />
                </div>
                <div className={productPageBundleStyles.stepSetupActions}>
                  <span title="Multi Language">
                    <s-button
                      variant="tertiary"
                      icon="globe"
                      accessibilityLabel="Multi Language"
                      onClick={() => openStepMultiLanguageModal(step.id)}
                    />
                  </span>
                  <span title="Clone current step">
                    <s-button
                      variant="tertiary"
                      icon="duplicate"
                      accessibilityLabel="Clone current step"
                      onClick={() => cloneStep(step.id)}
                    />
                  </span>
                  <span title="Delete current step">
                    <s-button
                      variant="tertiary"
                      icon="delete"
                      tone="critical"
                      accessibilityLabel="Delete current step"
                      onClick={() => deleteStep(step.id)}
                    />
                  </span>
                </div>
              </div>
              <p className={productPageBundleStyles.stepSetupDescription}>
                Edit your step name (Only visible if more than one step is
                present)
              </p>
              <s-stack direction="block" gap="small">
                <s-text-field
                  label="Step Name"
                  placeholder="Eg:- Add product"
                  value={step.name ?? ""}
                  onInput={(e) => {
                    stepsState.updateStepField(
                      step.id,
                      "name",
                      (e.target as HTMLInputElement).value,
                    );
                    markAsDirty();
                  }}
                  autocomplete="off"
                />
              </s-stack>
            </div>
          ),
      )}
    </div>
  );
}
