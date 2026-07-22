export interface DashboardTableRow<TBundle, TStatusDisplay, TTypeDisplay> {
  id: string;
  bundle: TBundle;
  name: string;
  status: TStatusDisplay;
  type: TTypeDisplay;
}

export function buildDashboardTableRows<
  TBundle extends {
    id: string;
    name: string;
    status: string;
    bundleType: string;
  },
  TStatusDisplay,
  TTypeDisplay,
>(
  bundles: TBundle[],
  getStatusDisplay: (status: string) => TStatusDisplay,
  getBundleTypeDisplay: (bundleType: string) => TTypeDisplay,
): DashboardTableRow<TBundle, TStatusDisplay, TTypeDisplay>[] {
  return bundles.map((bundle) => ({
    id: bundle.id,
    bundle,
    name: bundle.name,
    status: getStatusDisplay(bundle.status),
    type: getBundleTypeDisplay(bundle.bundleType),
  }));
}
