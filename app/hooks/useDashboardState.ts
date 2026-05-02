import { useState, useCallback } from "react";
import { appState as appStateService } from "../services/app.state.service";

export interface DeleteModalState {
  isOpen: boolean;
  bundleId: string | null;
}

export function useDashboardState() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bundleToDelete, setBundleToDelete] = useState<string | null>(null);

  const openDeleteModal = useCallback((bundleId: string) => {
    setBundleToDelete(bundleId);
    setDeleteModalOpen(true);
    appStateService.openModal('dashboard_deleteConfirm');
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setBundleToDelete(null);
    appStateService.closeModal('dashboard_deleteConfirm');
  }, []);

  return {
    deleteModalOpen,
    bundleToDelete,
    openDeleteModal,
    closeDeleteModal,
  };
}
