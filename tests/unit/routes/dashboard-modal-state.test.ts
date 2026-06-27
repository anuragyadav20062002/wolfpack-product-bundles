import {
  shouldRenderDashboardDeleteModal,
  shouldRenderDashboardPreviewModal,
} from "../../../app/routes/app/app.dashboard/dashboard-modal-state";

describe("dashboard modal state", () => {
  it("renders the delete modal only when a bundle is pending deletion", () => {
    expect(shouldRenderDashboardDeleteModal({ bundleToDelete: null })).toBe(false);
    expect(shouldRenderDashboardDeleteModal({ bundleToDelete: "bundle-1" })).toBe(true);
  });

  it("renders the preview modal only when it is open", () => {
    expect(shouldRenderDashboardPreviewModal({ isOpen: false })).toBe(false);
    expect(shouldRenderDashboardPreviewModal({ isOpen: true })).toBe(true);
  });
});
