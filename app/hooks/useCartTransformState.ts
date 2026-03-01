/**
 * Cart Transform State Hook
 *
 * Manages all state for the Cart Transform route including:
 * - Create bundle modal state
 * - Form inputs for bundle creation
 */

import { useState, useCallback } from "react";
import { appState as appStateService } from "../services/app.state.service";

// ============================================
// TYPES
// ============================================

export interface CreateBundleFormState {
  bundleName: string;
  description: string;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useCartTransformState() {
  // Create bundle modal state
  const [modalOpen, setModalOpen] = useState(false);

  // Create bundle form state
  const [bundleName, setBundleName] = useState("");
  const [description, setDescription] = useState("");

  // Open create bundle modal
  const openModal = useCallback(() => {
    setModalOpen(true);
    appStateService.openModal('cartTransform_createBundle');
  }, []);

  // Close create bundle modal and reset form
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setBundleName("");
    setDescription("");
    appStateService.closeModal('cartTransform_createBundle');
  }, []);

  // Reset form after successful submission
  const resetForm = useCallback(() => {
    setBundleName("");
    setDescription("");
  }, []);

  // Get form data for submission
  const getFormData = useCallback(() => {
    return {
      bundleName,
      description,
    };
  }, [bundleName, description]);

  return {
    // Modal state
    modalOpen,
    openModal,
    closeModal,

    // Form state
    bundleName,
    setBundleName,
    description,
    setDescription,
    resetForm,
    getFormData,
  };
}
