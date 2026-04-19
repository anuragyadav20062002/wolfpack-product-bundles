/**
 * Dashboard State Hook
 *
 * Manages all state for the Dashboard route including:
 * - Create bundle modal state
 * - Delete confirmation modal state
 * - Form inputs for bundle creation
 */

import { useState, useCallback } from "react";
import { appState as appStateService } from "../services/app.state.service";
import { FullPageLayout } from "../constants/bundle";

// ============================================
// TYPES
// ============================================

export interface CreateBundleFormState {
  bundleName: string;
  description: string;
  bundleType: string[];
}

export interface DeleteModalState {
  isOpen: boolean;
  bundleId: string | null;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useDashboardState() {
  // Create bundle modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Create bundle form state
  const [bundleName, setBundleName] = useState("");
  const [description, setDescription] = useState("");
  const [bundleType, setBundleType] = useState<string[]>(["product_page"]);
  const [fullPageLayout, setFullPageLayout] = useState<string>(FullPageLayout.FOOTER_BOTTOM);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bundleToDelete, setBundleToDelete] = useState<string | null>(null);

  // Open create bundle modal
  const openCreateModal = useCallback(() => {
    setCreateModalOpen(true);
    appStateService.openModal('dashboard_createBundle');
  }, []);

  // Close create bundle modal and reset form
  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
    setBundleName("");
    setDescription("");
    setBundleType(["product_page"]);
    setFullPageLayout(FullPageLayout.FOOTER_BOTTOM);
    appStateService.closeModal('dashboard_createBundle');
  }, []);

  // Open delete confirmation modal
  const openDeleteModal = useCallback((bundleId: string) => {
    setBundleToDelete(bundleId);
    setDeleteModalOpen(true);
    appStateService.openModal('dashboard_deleteConfirm');
  }, []);

  // Close delete confirmation modal
  const closeDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setBundleToDelete(null);
    appStateService.closeModal('dashboard_deleteConfirm');
  }, []);

  return {
    // Create modal state
    createModalOpen,
    openCreateModal,
    closeCreateModal,

    // Form state
    bundleName,
    setBundleName,
    description,
    setDescription,
    bundleType,
    setBundleType,
    fullPageLayout,
    setFullPageLayout,

    // Delete modal state
    deleteModalOpen,
    bundleToDelete,
    openDeleteModal,
    closeDeleteModal,
  };
}
