import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AdminRouteState {
  dashboard: {
    deleteModalOpen: boolean;
    bundleToDelete: string | null;
  };
  billing: {
    showCancelConfirm: boolean;
    showSuccessBanner: boolean;
    showErrorBanner: boolean;
  };
  cartTransform: {
    modalOpen: boolean;
    bundleName: string;
    description: string;
  };
}

export const defaultAdminRouteState: AdminRouteState = {
  dashboard: {
    deleteModalOpen: false,
    bundleToDelete: null,
  },
  billing: {
    showCancelConfirm: false,
    showSuccessBanner: false,
    showErrorBanner: false,
  },
  cartTransform: {
    modalOpen: false,
    bundleName: "",
    description: "",
  },
};

export const adminRouteStateSlice = createSlice({
  name: "adminRouteState",
  initialState: defaultAdminRouteState,
  reducers: {
    openDashboardDeleteModal(state, action: PayloadAction<string>) {
      state.dashboard.deleteModalOpen = true;
      state.dashboard.bundleToDelete = action.payload;
    },
    closeDashboardDeleteModal(state) {
      state.dashboard.deleteModalOpen = false;
      state.dashboard.bundleToDelete = null;
    },
    initializeBillingFeedback(
      state,
      action: PayloadAction<{ upgraded: boolean; callbackError: string | null }>,
    ) {
      state.billing.showSuccessBanner = action.payload.upgraded;
      state.billing.showErrorBanner = Boolean(action.payload.callbackError);
    },
    openBillingCancelConfirm(state) {
      state.billing.showCancelConfirm = true;
    },
    closeBillingCancelConfirm(state) {
      state.billing.showCancelConfirm = false;
    },
    dismissBillingSuccessBanner(state) {
      state.billing.showSuccessBanner = false;
    },
    dismissBillingErrorBanner(state) {
      state.billing.showErrorBanner = false;
    },
    showBillingSuccessBanner(state) {
      state.billing.showSuccessBanner = true;
    },
    showBillingErrorBanner(state) {
      state.billing.showErrorBanner = true;
    },
    openCartTransformModal(state) {
      state.cartTransform.modalOpen = true;
    },
    closeCartTransformModal(state) {
      state.cartTransform.modalOpen = false;
      state.cartTransform.bundleName = "";
      state.cartTransform.description = "";
    },
    setCartTransformName(state, action: PayloadAction<string>) {
      state.cartTransform.bundleName = action.payload;
    },
    setCartTransformDescription(state, action: PayloadAction<string>) {
      state.cartTransform.description = action.payload;
    },
    resetCartTransformForm(state) {
      state.cartTransform.bundleName = "";
      state.cartTransform.description = "";
    },
  },
});

export const {
  closeBillingCancelConfirm,
  closeCartTransformModal,
  closeDashboardDeleteModal,
  dismissBillingErrorBanner,
  dismissBillingSuccessBanner,
  initializeBillingFeedback,
  openBillingCancelConfirm,
  openCartTransformModal,
  openDashboardDeleteModal,
  resetCartTransformForm,
  setCartTransformDescription,
  setCartTransformName,
  showBillingErrorBanner,
  showBillingSuccessBanner,
} = adminRouteStateSlice.actions;

export const adminRouteStateReducer = adminRouteStateSlice.reducer;
