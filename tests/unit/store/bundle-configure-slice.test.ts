import { BundleStatus, BundleType } from "../../../app/constants/bundle";
import {
  addBundleStep,
  bundleConfigureReducer,
  clearBundleConfiguration,
  removeBundleStep,
  setBundleForm,
  setPricingSettings,
  setSelectedCollections,
  setStepConditions,
  updateBundleForm,
  updatePricingSettings,
} from "../../../app/store/slices/bundleConfigureSlice";
import type { BundleStep, PricingSettings } from "../../../app/types/state.types";

const step: BundleStep = {
  id: "step-1",
  name: "Step 1",
  collections: [],
  products: [],
  StepProduct: [],
  displayVariantsAsIndividual: false,
  minQuantity: 1,
  maxQuantity: 1,
  enabled: true,
};

const pricing: PricingSettings = {
  enabled: true,
  method: "percentage_off",
  rules: [],
  showFooter: true,
  showDiscountProgressBar: true,
};

describe("bundleConfigureSlice", () => {
  it("updates form fields and marks the draft dirty", () => {
    let state = bundleConfigureReducer(
      undefined,
      setBundleForm({
        id: "bundle-1",
        name: "Original",
        description: "",
        status: BundleStatus.DRAFT,
        bundleType: BundleType.PRODUCT_PAGE,
        templateName: "classic",
      }),
    );

    state = bundleConfigureReducer(state, updateBundleForm({ key: "name", value: "Updated" }));

    expect(state.form?.name).toBe("Updated");
    expect(state.isDirty).toBe(true);
  });

  it("removes related step conditions and selected collections when a step is removed", () => {
    let state = bundleConfigureReducer(undefined, addBundleStep(step));
    state = bundleConfigureReducer(
      state,
      setStepConditions({
        stepId: "step-1",
        conditions: [{ id: "condition-1", type: "quantity", operator: "gte", value: "2" }],
      }),
    );
    state = bundleConfigureReducer(
      state,
      setSelectedCollections({
        stepId: "step-1",
        collections: [{ id: "collection-1", title: "Collection", handle: "collection" }],
      }),
    );

    state = bundleConfigureReducer(state, removeBundleStep("step-1"));

    expect(state.steps).toEqual([]);
    expect(state.stepConditions).toEqual({});
    expect(state.selectedCollections).toEqual({});
    expect(state.isDirty).toBe(true);
  });

  it("updates pricing and clears the draft to defaults", () => {
    let state = bundleConfigureReducer(undefined, setPricingSettings(pricing));
    state = bundleConfigureReducer(state, updatePricingSettings({ method: "fixed_amount_off" }));

    expect(state.pricing?.method).toBe("fixed_amount_off");
    expect(state.isDirty).toBe(true);

    state = bundleConfigureReducer(state, clearBundleConfiguration());
    expect(state.form).toBeNull();
    expect(state.steps).toEqual([]);
    expect(state.pricing).toBeNull();
    expect(state.isDirty).toBe(false);
  });
});
