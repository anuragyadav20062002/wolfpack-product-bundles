/**
 * Billing State Hook
 *
 * Manages all state for the Billing route including:
 * - Cancel confirmation modal state
 * - Success/Error banner visibility
 */

import { useState, useCallback } from "react";
import { appState as appStateService } from "../services/app.state.service";

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
  // Cancel confirmation state
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Banner visibility states (initialized from loader)
  const [showSuccessBanner, setShowSuccessBanner] = useState(loaderData.upgraded);
  const [showErrorBanner, setShowErrorBanner] = useState(!!loaderData.callbackError);

  // Open cancel confirmation
  const openCancelConfirm = useCallback(() => {
    setShowCancelConfirm(true);
    appStateService.openModal('billing_cancelConfirm');
  }, []);

  // Close cancel confirmation
  const closeCancelConfirm = useCallback(() => {
    setShowCancelConfirm(false);
    appStateService.closeModal('billing_cancelConfirm');
  }, []);

  // Dismiss success banner
  const dismissSuccessBanner = useCallback(() => {
    setShowSuccessBanner(false);
  }, []);

  // Dismiss error banner
  const dismissErrorBanner = useCallback(() => {
    setShowErrorBanner(false);
  }, []);

  // Show success banner (for programmatic use)
  const showSuccess = useCallback(() => {
    setShowSuccessBanner(true);
  }, []);

  // Show error banner (for programmatic use)
  const showError = useCallback(() => {
    setShowErrorBanner(true);
  }, []);

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
