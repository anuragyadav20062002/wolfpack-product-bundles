import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SubscriptionState } from "../../types/state.types";

export const subscriptionSlice = createSlice({
  name: "subscription",
  initialState: null as SubscriptionState | null,
  reducers: {
    setSubscription(_state, action: PayloadAction<SubscriptionState>) {
      return { ...action.payload };
    },
    resetSubscription() {
      return null;
    },
  },
});

export const { resetSubscription, setSubscription } = subscriptionSlice.actions;
export const subscriptionReducer = subscriptionSlice.reducer;
