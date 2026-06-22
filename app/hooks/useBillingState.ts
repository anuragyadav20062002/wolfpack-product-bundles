/**
 * Billing State Hook
 *
 * Manages all state for the Billing route including:
 * - Cancel confirmation modal state
 * - Success/Error banner visibility
 */

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  closeBillingCancelConfirm,
  dismissBillingErrorBanner,
  dismissBillingSuccessBanner,
  initializeBillingFeedback,
  openBillingCancelConfirm,
  showBillingErrorBanner,
  showBillingSuccessBanner,
} from "../store/slices/adminRouteStateSlice";
import { closeModal, openModal } from "../store/slices/uiSlice";

// ============================================
// TYPES
// ============================================

export interface BillingLoaderData {
  upgraded: boolean;
  callbackError: string | null;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useBillingState(loaderData: BillingLoaderData) {
  const dispatch = useAppDispatch();
  const { callbackError, upgraded } = loaderData;
  const {
    showCancelConfirm,
    showSuccessBanner,
    showErrorBanner,
  } = useAppSelector((state) => state.adminRouteState.billing);

  useEffect(() => {
    dispatch(initializeBillingFeedback({ upgraded, callbackError }));
  }, [callbackError, dispatch, upgraded]);

  // Open cancel confirmation
  const openCancelConfirm = useCallback(() => {
    dispatch(openBillingCancelConfirm());
    dispatch(openModal("billing_cancelConfirm"));
  }, [dispatch]);

  // Close cancel confirmation
  const closeCancelConfirm = useCallback(() => {
    dispatch(closeBillingCancelConfirm());
    dispatch(closeModal("billing_cancelConfirm"));
  }, [dispatch]);

  // Dismiss success banner
  const dismissSuccessBanner = useCallback(() => {
    dispatch(dismissBillingSuccessBanner());
  }, [dispatch]);

  // Dismiss error banner
  const dismissErrorBanner = useCallback(() => {
    dispatch(dismissBillingErrorBanner());
  }, [dispatch]);

  // Show success banner (for programmatic use)
  const showSuccess = useCallback(() => {
    dispatch(showBillingSuccessBanner());
  }, [dispatch]);

  // Show error banner (for programmatic use)
  const showError = useCallback(() => {
    dispatch(showBillingErrorBanner());
  }, [dispatch]);

  return {
    // Cancel confirmation state
    showCancelConfirm,
    openCancelConfirm,
    closeCancelConfirm,

    // Success banner state
    showSuccessBanner,
    dismissSuccessBanner,
    showSuccess,

    // Error banner state
    showErrorBanner,
    dismissErrorBanner,
    showError,
  };
}
