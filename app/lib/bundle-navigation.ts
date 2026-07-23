export function getBundleEditPath(bundleId: string, bundleType: string) {
  const routeBase = bundleType === "full_page" ? "full-page-bundle" : "product-page-bundle";
  return `/app/bundles/${routeBase}/configure/${bundleId}`;
}

export function resolveCloneConfigureRedirect(response: {
  success?: unknown;
  redirectTo?: unknown;
}) {
  if (response.success !== true || typeof response.redirectTo !== "string") {
    return null;
  }

  const path = response.redirectTo.split("?", 1)[0];
  const segments = path.split("/");
  const isConfigureRoute =
    !response.redirectTo.includes("#") &&
    segments.length === 6 &&
    segments[0] === "" &&
    segments[1] === "app" &&
    segments[2] === "bundles" &&
    (segments[3] === "full-page-bundle" ||
      segments[3] === "product-page-bundle") &&
    segments[4] === "configure" &&
    segments[5].length > 0;

  return isConfigureRoute ? response.redirectTo : null;
}
