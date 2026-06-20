import { useState, useCallback } from "react";
import { useAppDispatch } from "../store/hooks";
import { closeModal, openModal } from "../store/slices/uiSlice";

export interface DeleteModalState {
  isOpen: boolean;
  bundleId: string | null;
}

export function useDashboardState() {
  const dispatch = useAppDispatch();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bundleToDelete, setBundleToDelete] = useState<string | null>(null);

  const openDeleteModal = useCallback((bundleId: string) => {
    setBundleToDelete(bundleId);
    setDeleteModalOpen(true);
    dispatch(openModal("dashboard_deleteConfirm"));
  }, [dispatch]);

  const closeDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
    setBundleToDelete(null);
    dispatch(closeModal("dashboard_deleteConfirm"));
  }, [dispatch]);

  return {
    deleteModalOpen,
    bundleToDelete,
    openDeleteModal,
    closeDeleteModal,
  };
}
