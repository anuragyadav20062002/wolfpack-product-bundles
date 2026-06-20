import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  closeDashboardDeleteModal,
  openDashboardDeleteModal,
} from "../store/slices/adminRouteStateSlice";
import { closeModal, openModal } from "../store/slices/uiSlice";

export interface DeleteModalState {
  isOpen: boolean;
  bundleId: string | null;
}

export function useDashboardState() {
  const dispatch = useAppDispatch();
  const { deleteModalOpen, bundleToDelete } = useAppSelector((state) => state.adminRouteState.dashboard);

  const openDeleteModal = useCallback((bundleId: string) => {
    dispatch(openDashboardDeleteModal(bundleId));
    dispatch(openModal("dashboard_deleteConfirm"));
  }, [dispatch]);

  const closeDeleteModal = useCallback(() => {
    dispatch(closeDashboardDeleteModal());
    dispatch(closeModal("dashboard_deleteConfirm"));
  }, [dispatch]);

  return {
    deleteModalOpen,
    bundleToDelete,
    openDeleteModal,
    closeDeleteModal,
  };
}
