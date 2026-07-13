export interface ProductPageDisplayConfiguration {
  showCompareAtPrices?: boolean | null;
}

export function resolveShowProductComparedAtPrice(
  configuration: ProductPageDisplayConfiguration,
): boolean {
  return configuration.showCompareAtPrices === true;
}
