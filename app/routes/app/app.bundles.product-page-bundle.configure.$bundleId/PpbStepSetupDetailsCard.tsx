import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbStepSetupDetailsCard({ step }: { step: any }) {
  const {
    cloneStep,
    deleteStep,
    markAsDirty,
    openStepMultiLanguageModal,
    productPageBundleStyles,
    stepsState,
  } = usePpbConfigureContext();

  return (
    <div className={productPageBundleStyles.card}>
      <div className={productPageBundleStyles.stepSetupHeader}>
        <div className={productPageBundleStyles.stepSetupTitleGroup}>
          <h3 className={productPageBundleStyles.stepSetupTitle}>Step Setup</h3>
          <s-switch
            accessibilityLabel="Enable step"
            checked={step.enabled !== false || undefined}
            onChange={(event) => {
              stepsState.updateStepField(
                step.id,
                "enabled",
                (event.target as HTMLInputElement).checked,
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
        Edit your step name (Only visible if more than one step is present)
      </p>
      <s-stack direction="block" gap="small">
        <s-text-field
          label="Step Name"
          placeholder="Eg:- Add product"
          value={step.name ?? ""}
          onInput={(event) => {
            stepsState.updateStepField(
              step.id,
              "name",
              (event.target as HTMLInputElement).value,
            );
            markAsDirty();
          }}
          autocomplete="off"
        />
      </s-stack>
    </div>
  );
}
