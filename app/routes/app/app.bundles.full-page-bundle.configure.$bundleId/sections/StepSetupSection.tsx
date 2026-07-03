import type { ConfigureBundleFlowContext } from "../useConfigureBundleFlow";
import { FpbStepCategoryCard } from "./StepSetupCategoryCard";
import { FpbStepConfigCard } from "./StepSetupConfigCard";
import { FpbStepSetupDetailsCard } from "./StepSetupDetailsCard";
import { FpbStepRulesCard } from "./StepSetupRulesCard";

export function StepSetupSection({
  flow,
}: {
  flow: ConfigureBundleFlowContext;
}) {
  const {
    activeSection,
    activeTabIndex,
    fullPageBundleStyles,
    handleAddNewStep,
    navigateToStep,
    QuestionHelpTooltip,
    slideDir,
    slideKey,
    stepsState,
  } = flow;

  if (activeSection !== "step_setup") return null;

  return (
    <div data-tour-target="fpb-step-setup">
      <div
        className={`${fullPageBundleStyles.card} ${fullPageBundleStyles.stepFlowCard}`}
      >
        <s-stack direction="block" gap="small">
          <div className={fullPageBundleStyles.stepFlowTitleRow}>
            <span className={fullPageBundleStyles.headingWithHelp}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 650 }}>
                Step Flow
              </h3>
              <QuestionHelpTooltip tooltipKey="stepFlow" />
            </span>
            <button
              type="button"
              className={fullPageBundleStyles.videoHelpButton}
              onClick={() =>
                window.open(
                  "https://www.youtube.com/watch?v=5p_B81I7tWE",
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              <svg
                className={fullPageBundleStyles.videoHelpIcon}
                viewBox="0 0 10 10"
                aria-hidden="true"
              >
                <path d="M2 1 L9 5 L2 9 Z" />
              </svg>
              How to setup?
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#6d7175" }}>
            Create steps for your multi-step bundle here. Select product options
            for each step below
          </p>
        </s-stack>
        {/* Step Chip Navigation */}
        <div className={fullPageBundleStyles.stepNav}>
          {stepsState.steps.map((step, i) => (
            <button
              key={step.id}
              className={
                activeTabIndex === i
                  ? fullPageBundleStyles.stepChipActive
                  : fullPageBundleStyles.stepChip
              }
              onClick={() => navigateToStep(i)}
            >
              <span className={fullPageBundleStyles.stepChipNumber}>
                {i + 1}
              </span>
              <span className={fullPageBundleStyles.stepChipLabel}>
                {step.name || `Step ${i + 1}`}
              </span>
              <span className={fullPageBundleStyles.stepChipChevron}>›</span>
            </button>
          ))}
          <button
            className={fullPageBundleStyles.addStepBtn}
            onClick={handleAddNewStep}
          >
            <span aria-hidden="true">+</span> <span>Add Step</span>
          </button>
        </div>
      </div>
      {stepsState.steps.map(
        (step, index) =>
          activeTabIndex === index && (
            <div
              key={`${step.id}-${slideKey}`}
              className={
                slideDir === "forward"
                  ? fullPageBundleStyles.slideForward
                  : slideDir === "backward"
                    ? fullPageBundleStyles.slideBackward
                    : ""
              }
            >
              <FpbStepSetupDetailsCard flow={flow} step={step} />
              <FpbStepCategoryCard flow={flow} step={step} />
              <FpbStepRulesCard flow={flow} step={step} />
              <FpbStepConfigCard flow={flow} step={step} />
            </div>
          ),
      )}
    </div>
  );
}
