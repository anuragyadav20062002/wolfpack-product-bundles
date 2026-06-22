/**
 * Cart Transform State Hook
 *
 * Manages all state for the Cart Transform route including:
 * - Create bundle modal state
 * - Form inputs for bundle creation
 */

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  closeCartTransformModal,
  openCartTransformModal,
  resetCartTransformForm,
  setCartTransformDescription,
  setCartTransformName,
} from "../store/slices/adminRouteStateSlice";
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
  const { modalOpen, bundleName, description } = useAppSelector((state) => state.adminRouteState.cartTransform);

  // Open create bundle modal
  const openModal = useCallback(() => {
    dispatch(openCartTransformModal());
    dispatch(openReduxModal("cartTransform_createBundle"));
  }, [dispatch]);

  // Close create bundle modal and reset form
  const closeModal = useCallback(() => {
    dispatch(closeCartTransformModal());
    dispatch(closeReduxModal("cartTransform_createBundle"));
  }, [dispatch]);

  // Reset form after successful submission
  const resetForm = useCallback(() => {
    dispatch(resetCartTransformForm());
  }, [dispatch]);

  const setBundleName = useCallback((value: string) => {
    dispatch(setCartTransformName(value));
  }, [dispatch]);

  const setDescription = useCallback((value: string) => {
    dispatch(setCartTransformDescription(value));
  }, [dispatch]);

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
