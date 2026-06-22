import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";
import { FpbStepCategoryAccordion } from "./StepSetupCategoryAccordion";
import { FpbStepCategoryFooter } from "./StepSetupCategoryFooter";

export function FpbStepCategoryCard({
  flow,
  step,
}: {
  flow: ConfigureBundleFlowContext;
  step: any;
}) {
  const { fullPageBundleStyles, QuestionHelpTooltip } = flow;
  const categories = ((step.StepCategory as any[] | undefined) ?? []);

  return (
    <>
      <div className={fullPageBundleStyles.card}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Category</h3>
          <QuestionHelpTooltip tooltipKey="category" />
        </div>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 14,
            color: "#6d7175",
          }}
        >
          Add all product selections in this step to a single category or
          separate them into multiple categories for better segregation.
        </p>
        {categories.length === 0 && (
          <div className={fullPageBundleStyles.emptyState}>
            No category defined yet
          </div>
        )}
        {categories.map((cat: any, catIndex: number) => (
          <FpbStepCategoryAccordion
            key={cat.id ?? catIndex}
            flow={flow}
            step={step}
            cat={cat}
            catIndex={catIndex}
          />
        ))}
        <FpbStepCategoryFooter flow={flow} step={step} />
      </div>
    </>
  );
}
