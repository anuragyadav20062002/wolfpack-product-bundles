export function shouldRenderAnalyticsNoDataBanner({
  hasNoData,
  pixelActive,
}: {
  hasNoData: boolean;
  pixelActive: boolean;
}): boolean {
  return hasNoData && pixelActive;
}
