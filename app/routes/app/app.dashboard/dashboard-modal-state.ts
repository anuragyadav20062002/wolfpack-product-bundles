export function shouldRenderDashboardDeleteModal({
  bundleToDelete,
}: {
  bundleToDelete: string | null;
}) {
  return Boolean(bundleToDelete);
}

export function shouldRenderDashboardPreviewModal({
  isOpen,
}: {
  isOpen: boolean;
}) {
  return isOpen;
}
