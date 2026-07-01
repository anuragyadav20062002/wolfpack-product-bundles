export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageSidePanelMethods } =
  require("../../../app/assets/widgets/full-page/methods/side-panel-methods.js");

const getSummaryProductRemovalState =
  fullPageSidePanelMethods.getSummaryProductRemovalState;

if (typeof getSummaryProductRemovalState !== "function") {
  throw new Error("Expected summary removal state helper missing");
}

describe("FPB summary current-step removal", () => {
  it("allows removing products from the current step", () => {
    const state = getSummaryProductRemovalState.call(
      {
        currentStepIndex: 1,
        selectedBundle: {
          steps: [{ name: "Step A" }, { name: "Step B" }],
        },
      },
      { stepIndex: 1 },
    );

    expect(state).toEqual({
      canRemove: true,
      targetStepName: "Step B",
      blockedMessage: "",
    });
  });

  it("blocks removing products from another paid step with EB toast copy", () => {
    const state = getSummaryProductRemovalState.call(
      {
        currentStepIndex: 1,
        selectedBundle: {
          steps: [{ name: "Step A" }, { name: "Step B" }],
        },
      },
      { stepIndex: 0 },
    );

    expect(state).toEqual({
      canRemove: false,
      targetStepName: "Step A",
      blockedMessage: "Remove This Product From Step A",
    });
  });

  it("blocks removing add-on step products while the shopper is on a paid step", () => {
    const state = getSummaryProductRemovalState.call(
      {
        currentStepIndex: 0,
        selectedBundle: {
          steps: [{ name: "Step A" }, { name: "Step B" }, { name: "Add On" }],
        },
      },
      { stepIndex: 2, isFreeGift: true },
    );

    expect(state).toEqual({
      canRemove: false,
      targetStepName: "Add On",
      blockedMessage: "Remove This Product From Add On",
    });
  });
});
