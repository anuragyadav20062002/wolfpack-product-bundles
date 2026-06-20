import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  BundleConfigurationState,
  BundleFormData,
  BundleStep,
  Collection,
  ConditionRule,
  PricingSettings,
} from "../../types/state.types";

export const defaultBundleConfigureState: BundleConfigurationState = {
  form: null,
  steps: [],
  pricing: null,
  stepConditions: {},
  selectedCollections: {},
  isDirty: false,
  isLoading: false,
};

export const bundleConfigureSlice = createSlice({
  name: "bundleConfiguration",
  initialState: defaultBundleConfigureState,
  reducers: {
    setBundleForm(state, action: PayloadAction<BundleFormData>) {
      state.form = { ...action.payload };
    },
    updateBundleForm<K extends keyof BundleFormData>(
      state: BundleConfigurationState,
      action: PayloadAction<{ key: K; value: BundleFormData[K] }>,
    ) {
      if (!state.form) return;
      state.form = {
        ...state.form,
        [action.payload.key]: action.payload.value,
      };
      state.isDirty = true;
    },
    setBundleSteps(state, action: PayloadAction<BundleStep[]>) {
      state.steps = [...action.payload];
    },
    addBundleStep(state, action: PayloadAction<BundleStep>) {
      state.steps.push({ ...action.payload });
      state.isDirty = true;
    },
    updateBundleStep(
      state,
      action: PayloadAction<{ stepId: string; updates: Partial<BundleStep> }>,
    ) {
      state.steps = state.steps.map((step) =>
        step.id === action.payload.stepId ? { ...step, ...action.payload.updates } : step,
      );
      state.isDirty = true;
    },
    removeBundleStep(state, action: PayloadAction<string>) {
      state.steps = state.steps.filter((step) => step.id !== action.payload);
      delete state.stepConditions[action.payload];
      delete state.selectedCollections[action.payload];
      state.isDirty = true;
    },
    setPricingSettings(state, action: PayloadAction<PricingSettings>) {
      state.pricing = { ...action.payload };
    },
    updatePricingSettings(state, action: PayloadAction<Partial<PricingSettings>>) {
      if (!state.pricing) return;
      state.pricing = {
        ...state.pricing,
        ...action.payload,
      };
      state.isDirty = true;
    },
    setStepConditions(
      state,
      action: PayloadAction<{ stepId: string; conditions: ConditionRule[] }>,
    ) {
      state.stepConditions[action.payload.stepId] = [...action.payload.conditions];
      state.isDirty = true;
    },
    setSelectedCollections(
      state,
      action: PayloadAction<{ stepId: string; collections: Collection[] }>,
    ) {
      state.selectedCollections[action.payload.stepId] = [...action.payload.collections];
      state.isDirty = true;
    },
    markBundleConfigurationDirty(state, action: PayloadAction<boolean>) {
      state.isDirty = action.payload;
    },
    setBundleConfigurationLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    clearBundleConfiguration() {
      return defaultBundleConfigureState;
    },
  },
});

export const {
  addBundleStep,
  clearBundleConfiguration,
  markBundleConfigurationDirty,
  removeBundleStep,
  setBundleConfigurationLoading,
  setBundleForm,
  setBundleSteps,
  setPricingSettings,
  setSelectedCollections,
  setStepConditions,
  updateBundleForm,
  updateBundleStep,
  updatePricingSettings,
} = bundleConfigureSlice.actions;

export const bundleConfigureReducer = bundleConfigureSlice.reducer;
