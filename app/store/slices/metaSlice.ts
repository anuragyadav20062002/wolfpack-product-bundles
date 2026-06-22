import { createSlice } from "@reduxjs/toolkit";

export const defaultMetaState = {
  initialized: true,
  lastUpdated: Date.now(),
  version: "1.0.0",
};

export const metaSlice = createSlice({
  name: "meta",
  initialState: defaultMetaState,
  reducers: {
    touchMeta(state) {
      state.lastUpdated = Date.now();
    },
    resetMeta() {
      return {
        ...defaultMetaState,
        lastUpdated: Date.now(),
      };
    },
  },
});

export const { resetMeta, touchMeta } = metaSlice.actions;
export const metaReducer = metaSlice.reducer;
