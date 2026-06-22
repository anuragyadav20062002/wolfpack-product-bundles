import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";

export function FpbStepCategoryFooter({
  flow,
  step,
}: {
  flow: ConfigureBundleFlowContext;
  step: any;
}) {
  const { fullPageBundleStyles, markAsDirty, stepsState } = flow;

  return (
    <>
      <button
        type="button"
        className={fullPageBundleStyles.addSectionButton}
        onClick={() => {
          const cats = (step.StepCategory as any[]) ?? [];
          stepsState.updateStepField(step.id, "StepCategory", [
            ...cats,
            {
              id: `cat-${Date.now()}`,
              name: "",
              title: "",
              sortOrder: cats.length,
              products: [],
              collections: [],
            },
          ]);
          markAsDirty();
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7 1v12M1 7h12"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        Add Category
      </button>
      <div style={{ margin: "12px 0" }}>
        <s-divider />
      </div>
      <s-checkbox
        label="Display variants as individual products"
        checked={step.displayVariantsAsIndividual ?? undefined}
        onChange={(e) => {
          const checked = (e.target as HTMLInputElement).checked;
          stepsState.updateStepField(
            step.id,
            "displayVariantsAsIndividual",
            checked,
          );
          markAsDirty();
        }}
      />
    </>
  );
}
