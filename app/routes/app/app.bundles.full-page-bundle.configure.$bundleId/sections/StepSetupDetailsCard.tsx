import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbStepSetupDetailsCard({
  flow,
  step,
}: {
  flow: ConfigureBundleFlowContext;
  step: any;
}) {
  const {
    cloneStep,
    deleteStep,
    fullPageBundleStyles,
    markAsDirty,
    openStepMultiLanguageModal,
    stepsState,
  } = flow;

  return (
    <>
      <div className={fullPageBundleStyles.card}>
        <div className={fullPageBundleStyles.stepSetupHeader}>
          <div className={fullPageBundleStyles.stepSetupTitleGroup}>
            <h3 className={fullPageBundleStyles.stepSetupTitle}>Step Setup</h3>
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
          <div className={fullPageBundleStyles.stepSetupActions}>
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
        <p className={fullPageBundleStyles.stepSetupDescription}>
          Edit your step name (Only visible if more than one step is present)
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
    </>
  );
}
