export const ANALYTICS_NO_DATA_BANNER_COPY = {
  heading: "No data for this period",
  body: "No attributed orders yet.",
} as const;

export function shouldRenderAnalyticsNoDataBanner({
  hasNoData,
  pixelActive,
}: {
  hasNoData: boolean;
  pixelActive: boolean;
}): boolean {
  return hasNoData && pixelActive;
}
