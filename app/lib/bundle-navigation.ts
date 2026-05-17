export function getBundleWizardConfigurePath(bundleId: string) {
  return `/app/bundles/create/configure/${bundleId}`;
}

export function getBundleEditPath(bundleId: string, bundleType: string) {
  const routeBase = bundleType === "full_page" ? "full-page-bundle" : "product-page-bundle";
  return `/app/bundles/${routeBase}/configure/${bundleId}`;
}
