import {
  closeModal,
  hideToast,
  openModal,
  setLoading,
  setNavigation,
  showToast,
  toggleModal,
  uiReducer,
} from "../../../app/store/slices/uiSlice";

describe("uiSlice", () => {
  it("opens, closes, and toggles keyed modals", () => {
    let state = uiReducer(undefined, openModal("billing_cancelConfirm"));
    expect(state.modals.billing_cancelConfirm).toBe(true);

    state = uiReducer(state, closeModal("billing_cancelConfirm"));
    expect(state.modals.billing_cancelConfirm).toBe(false);

    state = uiReducer(state, toggleModal("billing_cancelConfirm"));
    expect(state.modals.billing_cancelConfirm).toBe(true);
  });

  it("adds and hides toasts", () => {
    const withToast = uiReducer(
      undefined,
      showToast({ id: "toast-1", message: "Saved", isError: false }),
    );

    expect(withToast.toasts).toEqual([
      { id: "toast-1", message: "Saved", isError: false, isVisible: true },
    ]);

    const hidden = uiReducer(withToast, hideToast("toast-1"));
    expect(hidden.toasts).toEqual([]);
  });

  it("merges navigation updates and tracks loading", () => {
    const navigated = uiReducer(undefined, setNavigation({ activeSubSection: "pricing" }));
    expect(navigated.navigation).toEqual({
      expandedSection: null,
      activeSubSection: "pricing",
      activeTabIndex: 0,
    });

    const loading = uiReducer(navigated, setLoading(true));
    expect(loading.isLoading).toBe(true);
  });
});
