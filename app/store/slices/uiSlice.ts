import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { NavigationState, ToastState, UIState } from "../../types/state.types";

export const defaultUIState: UIState = {
  modals: {},
  toasts: [],
  navigation: {
    expandedSection: null,
    activeSubSection: "",
    activeTabIndex: 0,
  },
  isLoading: false,
};

function createToastId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export const uiSlice = createSlice({
  name: "ui",
  initialState: defaultUIState,
  reducers: {
    openModal(state, action: PayloadAction<string>) {
      state.modals[action.payload] = true;
    },
    closeModal(state, action: PayloadAction<string>) {
      state.modals[action.payload] = false;
    },
    toggleModal(state, action: PayloadAction<string>) {
      state.modals[action.payload] = !state.modals[action.payload];
    },
    showToast(
      state,
      action: PayloadAction<{ message: string; isError?: boolean; id?: string }>,
    ) {
      const toast: ToastState = {
        id: action.payload.id ?? createToastId(),
        message: action.payload.message,
        isError: action.payload.isError ?? false,
        isVisible: true,
      };
      state.toasts.push(toast);
    },
    hideToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    setNavigation(state, action: PayloadAction<Partial<NavigationState>>) {
      state.navigation = {
        ...state.navigation,
        ...action.payload,
      };
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    resetUIState() {
      return defaultUIState;
    },
  },
});

export const {
  closeModal,
  hideToast,
  openModal,
  resetUIState,
  setLoading,
  setNavigation,
  showToast,
  toggleModal,
} = uiSlice.actions;

export const uiReducer = uiSlice.reducer;
