import { usePpbConfigureContext } from "./PpbConfigureContext";

export function PpbCategoryStepSettings() {
  const {
    markAsDirty,
    setUseSingleStepCategoriesAsBundleSteps,
    useSingleStepCategoriesAsBundleSteps,
  } = usePpbConfigureContext();

  return (
    <s-section>
      <s-stack direction="block" gap="small">
        <s-stack direction="inline" alignItems="center" gap="small">
          <s-text>Use categories as bundle steps</s-text>
          <s-switch
            accessibilityLabel="Use categories as bundle steps"
            checked={useSingleStepCategoriesAsBundleSteps || undefined}
            onChange={(event) => {
              setUseSingleStepCategoriesAsBundleSteps(
                (event.target as HTMLInputElement).checked,
              );
              markAsDirty();
            }}
          />
        </s-stack>
        <s-text tone="subdued">
          Show one category at a time with step navigation.
        </s-text>
      </s-stack>
    </s-section>
  );
}
