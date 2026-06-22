import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserPreferences } from "../../types/state.types";

export const defaultPreferencesState: UserPreferences = {
  sidebarCollapsed: false,
  recentBundles: [],
  theme: "system",
  showTips: true,
};

export const preferencesSlice = createSlice({
  name: "preferences",
  initialState: defaultPreferencesState,
  reducers: {
    setPreferences(state, action: PayloadAction<Partial<UserPreferences>>) {
      return {
        ...state,
        ...action.payload,
      };
    },
    addRecentBundle(state, action: PayloadAction<string>) {
      const recentBundles = state.recentBundles.filter((bundleId) => bundleId !== action.payload);
      recentBundles.unshift(action.payload);
      state.recentBundles = recentBundles.slice(0, 10);
    },
    resetPreferencesState() {
      return defaultPreferencesState;
    },
  },
});

export const { addRecentBundle, resetPreferencesState, setPreferences } = preferencesSlice.actions;
export const preferencesReducer = preferencesSlice.reducer;
