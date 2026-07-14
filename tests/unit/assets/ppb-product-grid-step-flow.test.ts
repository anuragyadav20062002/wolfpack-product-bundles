import { shouldUseCascadeStepFlow } from "../../../app/assets/widgets/product-page/methods/layout-shell-methods.js";

describe("PPB Product Grid step flow", () => {
  it("uses one active step for a multi-step in-page Grid", () => {
    expect(shouldUseCascadeStepFlow({
      isInpage: true,
      isCascade: false,
      isGrid: true,
      steps: [{ id: "step-1" }, { id: "step-2" }],
    })).toBe(true);
  });

  it("does not add step navigation to a single-step Grid", () => {
    expect(shouldUseCascadeStepFlow({
      isInpage: true,
      isCascade: false,
      isGrid: true,
      steps: [{ id: "step-1" }],
    })).toBe(false);
  });

  it("does not apply the in-page step flow to modal templates", () => {
    expect(shouldUseCascadeStepFlow({
      isInpage: false,
      isCascade: false,
      isGrid: true,
      steps: [{ id: "step-1" }, { id: "step-2" }],
    })).toBe(false);
  });
});
