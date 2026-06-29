export function shouldRenderDashboardActionMenu({
  activeMenuBundleId,
  bundleId,
}: {
  activeMenuBundleId: string | null;
  bundleId: string;
}) {
  return activeMenuBundleId === bundleId;
}
