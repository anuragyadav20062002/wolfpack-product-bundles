import { usePpbConfigureContext } from "./PpbConfigureContext";
import { PpbRulesConfigurationCard } from "./PpbRulesConfigurationCard";
import { PpbStepCategoriesCard } from "./PpbStepCategoriesCard";
import { PpbStepConfigCard } from "./PpbStepConfigCard";
import { PpbStepFlowCard } from "./PpbStepFlowCard";
import { PpbStepSetupDetailsCard } from "./PpbStepSetupDetailsCard";
import { getStepCategories } from "./PpbStepSetupShared";

export function PpbStepSetupSection() {
  const {
    activeSection,
    activeTabIndex,
    productPageBundleStyles,
    slideDir,
    slideKey,
    stepsState,
  } = usePpbConfigureContext();

  return (
    <>
      {activeSection === "step_setup" && (
        <div data-tour-target="ppb-product-selection">
          <PpbStepFlowCard />
          {stepsState.steps.map(
            (step, index) =>
              activeTabIndex === index && (
                <div
                  key={`${step.id}-${slideKey}-categories`}
                  className={
                    slideDir === "forward"
                      ? productPageBundleStyles.slideForward
                      : slideDir === "backward"
                        ? productPageBundleStyles.slideBackward
                        : ""
                  }
                >
                  {step.StepProduct &&
                    step.StepProduct.length > 0 &&
                    getStepCategories(step).length === 0 && (
                      <s-banner tone="warning">
                        <p style={{ margin: 0, fontSize: 14 }}>
                          <strong>Action needed:</strong> This step has
                          {step.StepProduct.length} product
                          {step.StepProduct.length !== 1 ? "s" : ""} from the
                          previous system. Use <strong>+ Add Category</strong>
                          below to re-add them to the new category system.
                        </p>
                      </s-banner>
                    )}
                  <PpbStepSetupDetailsCard step={step} />
                  <PpbStepCategoriesCard step={step} />
                  <PpbRulesConfigurationCard step={step} />
                  <PpbStepConfigCard step={step} />
                </div>
              ),
          )}
        </div>
      )}
    </>
  );
}
