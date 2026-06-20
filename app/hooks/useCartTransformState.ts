/**
 * Cart Transform State Hook
 *
 * Manages all state for the Cart Transform route including:
 * - Create bundle modal state
 * - Form inputs for bundle creation
 */

import { useState, useCallback } from "react";
import { useAppDispatch } from "../store/hooks";
import { closeModal as closeReduxModal, openModal as openReduxModal } from "../store/slices/uiSlice";

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
  const dispatch = useAppDispatch();
  // Create bundle modal state
  const [modalOpen, setModalOpen] = useState(false);

  // Create bundle form state
  const [bundleName, setBundleName] = useState("");
  const [description, setDescription] = useState("");

  // Open create bundle modal
  const openModal = useCallback(() => {
    setModalOpen(true);
    dispatch(openReduxModal("cartTransform_createBundle"));
  }, [dispatch]);

  // Close create bundle modal and reset form
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setBundleName("");
    setDescription("");
    dispatch(closeReduxModal("cartTransform_createBundle"));
  }, [dispatch]);

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
