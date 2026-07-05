export {};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fullPageSelectionNavigationMethods } =
  require("../../../app/assets/widgets/full-page/methods/selection-navigation-methods.js");

describe("FPB category collection rule validation", () => {
  it("counts selected products loaded from a category collection toward category amount rules", () => {
    const validateStep = fullPageSelectionNavigationMethods.validateStep;
    if (typeof validateStep !== "function") {
      throw new Error("Expected validateStep method missing");
    }

    const ctx = {
      selectedBundle: {
        steps: [
          {
            categories: [
              {
                title: "Statement Earrings",
                collections: [{ handle: "automated-collection" }],
                products: [],
                conditions: [
                  {
                    type: "amount",
                    value: "100",
                    condition: "greaterThanOrEqualTo",
                  },
                ],
              },
            ],
          },
        ],
      },
      selectedProducts: [{ variant1: 1 }],
      stepProductData: [
        [
          {
            variantId: "variant1",
            parentProductId: "product1",
            price: 15000,
          },
        ],
      ],
      stepCollectionProductIds: {
        "0:automated-collection": ["product1"],
      },
      _getStepConditionSelections(_stepIndex: number, selections: Record<string, number>) {
        return selections;
      },
      extractId(value: string) {
        return value;
      },
    };

    expect(validateStep.call(ctx, 0)).toBe(true);
  });
});
