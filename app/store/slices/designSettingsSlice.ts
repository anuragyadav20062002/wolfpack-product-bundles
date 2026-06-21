import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { BundleType } from "../../constants/bundle";
import type { DesignSettings, DesignSettingsState } from "../../types/state.types";

export const defaultDesignSettingsState: DesignSettingsState = {
  fullPage: null,
  productPage: null,
  selectedBundleType: BundleType.PRODUCT_PAGE,
  isDirty: false,
  isLoading: false,
};

function settingsKey(bundleType: "full_page" | "product_page"): "fullPage" | "productPage" {
  return bundleType === BundleType.FULL_PAGE ? "fullPage" : "productPage";
}

export const designSettingsSlice = createSlice({
  name: "designSettings",
  initialState: defaultDesignSettingsState,
  reducers: {
    setDesignSettings(
      state,
      action: PayloadAction<{ bundleType: "full_page" | "product_page"; settings: DesignSettings }>,
    ) {
      state[settingsKey(action.payload.bundleType)] = { ...action.payload.settings };
      state.isDirty = false;
    },
    updateDesignSetting<K extends keyof DesignSettings>(
      state: DesignSettingsState,
      action: PayloadAction<{ key: K; value: DesignSettings[K] }>,
    ) {
      const key = settingsKey(state.selectedBundleType);
      const currentSettings = state[key];
      if (!currentSettings) return;

      state[key] = {
        ...currentSettings,
        [action.payload.key]: action.payload.value,
      };
      state.isDirty = true;
    },
    setSelectedBundleType(state, action: PayloadAction<"full_page" | "product_page">) {
      state.selectedBundleType = action.payload;
    },
    markDesignSettingsDirty(state, action: PayloadAction<boolean>) {
      state.isDirty = action.payload;
    },
    setDesignSettingsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    resetDesignSettingsState() {
      return defaultDesignSettingsState;
    },
  },
});

export const {
  markDesignSettingsDirty,
  resetDesignSettingsState,
  setDesignSettings,
  setDesignSettingsLoading,
  setSelectedBundleType,
  updateDesignSetting,
} = designSettingsSlice.actions;

export const designSettingsReducer = designSettingsSlice.reducer;
