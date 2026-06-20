import {
  adminRouteStateReducer,
  closeCartTransformModal,
  closeDashboardDeleteModal,
  closeBillingCancelConfirm,
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
} from "../../../app/store/slices/adminRouteStateSlice";

describe("adminRouteStateSlice", () => {
  it("stores and clears dashboard delete modal state", () => {
    let state = adminRouteStateReducer(undefined, openDashboardDeleteModal("bundle-1"));

    expect(state.dashboard.deleteModalOpen).toBe(true);
    expect(state.dashboard.bundleToDelete).toBe("bundle-1");

    state = adminRouteStateReducer(state, closeDashboardDeleteModal());
    expect(state.dashboard.deleteModalOpen).toBe(false);
    expect(state.dashboard.bundleToDelete).toBeNull();
  });

  it("initializes and updates billing modal and banner state", () => {
    let state = adminRouteStateReducer(
      undefined,
      initializeBillingFeedback({ upgraded: true, callbackError: "failed" }),
    );

    expect(state.billing.showSuccessBanner).toBe(true);
    expect(state.billing.showErrorBanner).toBe(true);

    state = adminRouteStateReducer(state, dismissBillingSuccessBanner());
    state = adminRouteStateReducer(state, dismissBillingErrorBanner());
    expect(state.billing.showSuccessBanner).toBe(false);
    expect(state.billing.showErrorBanner).toBe(false);

    state = adminRouteStateReducer(state, showBillingSuccessBanner());
    state = adminRouteStateReducer(state, showBillingErrorBanner());
    state = adminRouteStateReducer(state, openBillingCancelConfirm());
    expect(state.billing.showSuccessBanner).toBe(true);
    expect(state.billing.showErrorBanner).toBe(true);
    expect(state.billing.showCancelConfirm).toBe(true);

    state = adminRouteStateReducer(state, closeBillingCancelConfirm());
    expect(state.billing.showCancelConfirm).toBe(false);
  });

  it("stores cart transform modal and form state and resets it on close", () => {
    let state = adminRouteStateReducer(undefined, openCartTransformModal());
    state = adminRouteStateReducer(state, setCartTransformName("Bundle"));
    state = adminRouteStateReducer(state, setCartTransformDescription("Description"));

    expect(state.cartTransform.modalOpen).toBe(true);
    expect(state.cartTransform.bundleName).toBe("Bundle");
    expect(state.cartTransform.description).toBe("Description");

    state = adminRouteStateReducer(state, resetCartTransformForm());
    expect(state.cartTransform.bundleName).toBe("");
    expect(state.cartTransform.description).toBe("");

    state = adminRouteStateReducer(state, setCartTransformName("Bundle"));
    state = adminRouteStateReducer(state, closeCartTransformModal());
    expect(state.cartTransform.modalOpen).toBe(false);
    expect(state.cartTransform.bundleName).toBe("");
    expect(state.cartTransform.description).toBe("");
  });
});
